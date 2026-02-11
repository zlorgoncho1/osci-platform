import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { Task } from './entities/task.entity';
import { ChecklistRunItem } from '../checklists/entities/checklist-run-item.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from '../../common/enums';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(ChecklistRunItem)
    private readonly checklistRunItemRepository: Repository<ChecklistRunItem>,
  ) {}

  async findAll(filters?: {
    status?: TaskStatus;
    assignedToId?: string;
    objectId?: string;
    projectId?: string;
    parentTaskId?: string;
    checklistId?: string;
    objectGroupId?: string;
  }): Promise<Task[]> {
    const where: FindOptionsWhere<Task> = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.assignedToId) {
      where.assignedToId = filters.assignedToId;
    }
    if (filters?.objectId) {
      where.objectId = filters.objectId;
    }
    if (filters?.projectId) {
      where.projectId = filters.projectId;
    }
    if (filters?.parentTaskId) {
      where.parentTaskId = filters.parentTaskId;
    }
    if (filters?.checklistId) {
      const runItems = await this.checklistRunItemRepository
        .createQueryBuilder('ri')
        .innerJoin('ri.checklistRun', 'cr')
        .where('cr.checklistId = :cid', { cid: filters.checklistId })
        .select('ri.id')
        .getMany();
      const ids = runItems.map((r) => r.id);
      if (ids.length === 0) return [];
      where.checklistRunItemId = In(ids);
    }
    if (filters?.objectGroupId) {
      const objectIds = await this.getObjectIdsByGroup(filters.objectGroupId);
      if (objectIds.length === 0) return [];
      where.objectId = In(objectIds);
    }

    return this.taskRepository.find({
      where,
      relations: ['object', 'project', 'children'],
      order: { createdAt: 'DESC' },
    });
  }

  private async getObjectIdsByGroup(groupId: string): Promise<string[]> {
    const members = await this.taskRepository.manager
      .createQueryBuilder()
      .select('gom.objectId')
      .from('object_group_members', 'gom')
      .where('gom.groupId = :groupId', { groupId })
      .getRawMany();
    return members.map((m: { objectId: string }) => m.objectId);
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['object'],
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return task;
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create({
      title: dto.title,
      objectId: dto.objectId || null,
      description: dto.description || null,
      priority: dto.priority,
      assignedToId: dto.assignedToId || null,
      slaDue: dto.slaDue ? new Date(dto.slaDue) : null,
      projectId: dto.projectId || null,
      parentTaskId: dto.parentTaskId || null,
      labels: dto.labels || null,
    });
    return this.taskRepository.save(task);
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.priority !== undefined) task.priority = dto.priority;
    if (dto.assignedToId !== undefined) task.assignedToId = dto.assignedToId;
    if (dto.slaDue !== undefined) task.slaDue = dto.slaDue ? new Date(dto.slaDue) : null;
    if (dto.projectId !== undefined) task.projectId = dto.projectId || null;
    if (dto.parentTaskId !== undefined) task.parentTaskId = dto.parentTaskId || null;
    if (dto.labels !== undefined) task.labels = dto.labels || null;

    return this.taskRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepository.remove(task);
  }
}
