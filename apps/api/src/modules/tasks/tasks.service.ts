import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { Task } from './entities/task.entity';
import { TaskConcerned } from './entities/task-concerned.entity';
import { ChecklistRunItem } from '../checklists/entities/checklist-run-item.entity';
import { User } from '../users/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from '../../common/enums';

export interface UserSummary {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskConcerned)
    private readonly concernedRepo: Repository<TaskConcerned>,
    @InjectRepository(ChecklistRunItem)
    private readonly checklistRunItemRepository: Repository<ChecklistRunItem>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // --- User resolution helper ---

  private async resolveUsers(ids: string[]): Promise<Record<string, UserSummary>> {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (uniqueIds.length === 0) return {};
    const users = await this.userRepo.find({ where: { id: In(uniqueIds) } });
    const map: Record<string, UserSummary> = {};
    for (const u of users) {
      map[u.id] = { id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName };
    }
    return map;
  }

  private async validateUserExists(userId: string, fieldName: string): Promise<void> {
    if (!userId) return;
    const exists = await this.userRepo.findOne({ where: { id: userId }, select: ['id'] });
    if (!exists) {
      throw new BadRequestException(`${fieldName}: User with id "${userId}" does not exist`);
    }
  }

  // --- Enrich tasks with resolved users ---

  private enrichTasks(tasks: Task[], userMap: Record<string, UserSummary>): any[] {
    return tasks.map((t) => ({
      ...t,
      assignedTo: t.assignedToId ? userMap[t.assignedToId] || null : null,
      lead: t.leadId ? userMap[t.leadId] || null : null,
    }));
  }

  // --- findAll with concernedUserId filter ---

  async findAll(filters?: {
    status?: TaskStatus;
    assignedToId?: string;
    objectId?: string;
    projectId?: string;
    parentTaskId?: string;
    checklistId?: string;
    objectGroupId?: string;
    concernedUserId?: string;
  }): Promise<any[]> {
    // If concernedUserId filter is set, use query builder for OR logic
    if (filters?.concernedUserId) {
      return this.findAllConcerned(filters);
    }

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

    const tasks = await this.taskRepository.find({
      where,
      relations: ['object', 'project', 'children'],
      order: { createdAt: 'DESC' },
    });

    const userIds = tasks.flatMap((t) => [t.assignedToId, t.leadId]).filter(Boolean) as string[];
    const userMap = await this.resolveUsers(userIds);

    return this.enrichTasks(tasks, userMap);
  }

  private async findAllConcerned(filters: {
    status?: TaskStatus;
    assignedToId?: string;
    objectId?: string;
    projectId?: string;
    parentTaskId?: string;
    checklistId?: string;
    objectGroupId?: string;
    concernedUserId?: string;
  }): Promise<any[]> {
    const cuid = filters.concernedUserId!;
    const qb = this.taskRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.object', 'object')
      .leftJoinAndSelect('t.project', 'project')
      .leftJoinAndSelect('t.children', 'children')
      .where(
        `(t.assignedToId = :cuid OR t.leadId = :cuid OR t.id IN (SELECT tc."taskId" FROM task_concerned tc WHERE tc."userId" = :cuid))`,
        { cuid },
      )
      .orderBy('t.createdAt', 'DESC');

    if (filters.status) qb.andWhere('t.status = :status', { status: filters.status });
    if (filters.objectId) qb.andWhere('t.objectId = :objectId', { objectId: filters.objectId });
    if (filters.projectId) qb.andWhere('t.projectId = :projectId', { projectId: filters.projectId });
    if (filters.assignedToId) qb.andWhere('t.assignedToId = :assignedToId', { assignedToId: filters.assignedToId });
    if (filters.parentTaskId) qb.andWhere('t.parentTaskId = :parentTaskId', { parentTaskId: filters.parentTaskId });

    if (filters.checklistId) {
      qb.andWhere(
        `t.checklistRunItemId IN (SELECT ri.id FROM checklist_run_items ri INNER JOIN checklist_runs cr ON ri."checklistRunId" = cr.id WHERE cr."checklistId" = :checklistId)`,
        { checklistId: filters.checklistId },
      );
    }
    if (filters.objectGroupId) {
      qb.andWhere(
        `t.objectId IN (SELECT gom."objectId" FROM object_group_members gom WHERE gom."groupId" = :objectGroupId)`,
        { objectGroupId: filters.objectGroupId },
      );
    }

    const tasks = await qb.getMany();
    const userIds = tasks.flatMap((t) => [t.assignedToId, t.leadId]).filter(Boolean) as string[];
    const userMap = await this.resolveUsers(userIds);
    return this.enrichTasks(tasks, userMap);
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

  async findOne(id: string): Promise<any> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['object', 'project'],
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    // Resolve users
    const concerned = await this.concernedRepo.find({ where: { taskId: id } });
    const allUserIds = [task.assignedToId, task.leadId, ...concerned.map((c) => c.userId)].filter(Boolean) as string[];
    const userMap = await this.resolveUsers(allUserIds);

    return {
      ...task,
      assignedTo: task.assignedToId ? userMap[task.assignedToId] || null : null,
      lead: task.leadId ? userMap[task.leadId] || null : null,
      concerned: concerned.map((c) => userMap[c.userId] || { id: c.userId, email: '', firstName: null, lastName: null }),
    };
  }

  async create(dto: CreateTaskDto): Promise<any> {
    if (dto.assignedToId) await this.validateUserExists(dto.assignedToId, 'assignedToId');
    if (dto.leadId) await this.validateUserExists(dto.leadId, 'leadId');

    const task = this.taskRepository.create({
      title: dto.title,
      objectId: dto.objectId || null,
      description: dto.description || null,
      priority: dto.priority,
      assignedToId: dto.assignedToId || null,
      leadId: dto.leadId || null,
      slaDue: dto.slaDue ? new Date(dto.slaDue) : null,
      projectId: dto.projectId || null,
      parentTaskId: dto.parentTaskId || null,
      labels: dto.labels || null,
    });
    const saved = await this.taskRepository.save(task);

    const userMap = await this.resolveUsers([saved.assignedToId, saved.leadId].filter(Boolean) as string[]);
    return {
      ...saved,
      assignedTo: saved.assignedToId ? userMap[saved.assignedToId] || null : null,
      lead: saved.leadId ? userMap[saved.leadId] || null : null,
    };
  }

  async update(id: string, dto: UpdateTaskDto): Promise<any> {
    const task = await this.taskRepository.findOne({ where: { id }, relations: ['object', 'project'] });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    if (dto.assignedToId !== undefined && dto.assignedToId) {
      await this.validateUserExists(dto.assignedToId, 'assignedToId');
    }
    if (dto.leadId !== undefined && dto.leadId) {
      await this.validateUserExists(dto.leadId, 'leadId');
    }

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description || null;
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.priority !== undefined) task.priority = dto.priority;
    if (dto.assignedToId !== undefined) task.assignedToId = dto.assignedToId || null;
    if (dto.leadId !== undefined) task.leadId = dto.leadId || null;
    if (dto.slaDue !== undefined) task.slaDue = dto.slaDue ? new Date(dto.slaDue) : null;
    if (dto.projectId !== undefined) task.projectId = dto.projectId || null;
    if (dto.parentTaskId !== undefined) task.parentTaskId = dto.parentTaskId || null;
    if (dto.labels !== undefined) task.labels = dto.labels || null;

    const saved = await this.taskRepository.save(task);

    const userMap = await this.resolveUsers([saved.assignedToId, saved.leadId].filter(Boolean) as string[]);
    return {
      ...saved,
      assignedTo: saved.assignedToId ? userMap[saved.assignedToId] || null : null,
      lead: saved.leadId ? userMap[saved.leadId] || null : null,
    };
  }

  async remove(id: string): Promise<void> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    await this.concernedRepo.delete({ taskId: id });
    await this.taskRepository.remove(task);
  }

  // --- Concerned ---

  async getConcerned(taskId: string): Promise<UserSummary[]> {
    await this.findOneRaw(taskId);
    const concerned = await this.concernedRepo.find({ where: { taskId } });
    const userMap = await this.resolveUsers(concerned.map((c) => c.userId));
    return concerned.map((c) => userMap[c.userId] || { id: c.userId, email: '', firstName: null, lastName: null });
  }

  async addConcerned(taskId: string, userIds: string[]): Promise<UserSummary[]> {
    await this.findOneRaw(taskId);
    for (const uid of userIds) {
      await this.validateUserExists(uid, 'userId');
    }

    for (const uid of userIds) {
      const exists = await this.concernedRepo.findOne({ where: { taskId, userId: uid } });
      if (!exists) {
        await this.concernedRepo.save(this.concernedRepo.create({ taskId, userId: uid }));
      }
    }

    return this.getConcerned(taskId);
  }

  async removeConcerned(taskId: string, userId: string): Promise<void> {
    await this.findOneRaw(taskId);
    await this.concernedRepo.delete({ taskId, userId });
  }

  private async findOneRaw(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return task;
  }
}
