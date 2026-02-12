import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { SecurityProject } from './entities/security-project.entity';
import { ProjectMilestone } from './entities/project-milestone.entity';
import { Task } from '../tasks/entities/task.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { ProjectStatus, TaskStatus, ResourceType, Action } from '../../common/enums';
import { AuthorizationService } from '../rbac/authorization.service';
import { ResourceAccessService } from '../rbac/resource-access.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(SecurityProject)
    private readonly projectRepo: Repository<SecurityProject>,
    @InjectRepository(ProjectMilestone)
    private readonly milestoneRepo: Repository<ProjectMilestone>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly authorizationService: AuthorizationService,
    private readonly resourceAccessService: ResourceAccessService,
  ) {}

  async findAll(
    userId: string,
    filters?: { status?: ProjectStatus; ownerId?: string },
  ): Promise<SecurityProject[]> {
    const accessibleIds = await this.authorizationService.getAccessibleResourceIds(
      userId,
      ResourceType.Project,
    );

    const qb = this.projectRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.milestones', 'milestones')
      .orderBy('p.createdAt', 'DESC');

    if (accessibleIds !== 'all') {
      // Include resources the user created OR has explicit access to
      if (accessibleIds.length === 0) {
        qb.where('p.createdById = :userId', { userId });
      } else {
        qb.where('(p.id IN (:...accessibleIds) OR p.createdById = :userId)', {
          accessibleIds,
          userId,
        });
      }
    }

    if (filters?.status) {
      qb.andWhere('p.status = :status', { status: filters.status });
    }
    if (filters?.ownerId) {
      qb.andWhere('p.ownerId = :ownerId', { ownerId: filters.ownerId });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<SecurityProject> {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['milestones', 'object'],
    });
    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }
    return project;
  }

  async create(dto: CreateProjectDto, userId: string): Promise<SecurityProject> {
    const project = this.projectRepo.create({
      name: dto.name,
      description: dto.description || null,
      status: dto.status || ProjectStatus.Planning,
      ownerId: dto.ownerId,
      createdById: userId,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      targetEndDate: dto.targetEndDate ? new Date(dto.targetEndDate) : null,
      objectId: dto.objectId || null,
    });
    const saved = await this.projectRepo.save(project);

    // Create ResourceAccess for the creator
    await this.resourceAccessService.createCreatorAccess(
      ResourceType.Project,
      saved.id,
      userId,
    );

    return saved;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<SecurityProject> {
    const project = await this.findOne(id);

    if (dto.name !== undefined) project.name = dto.name;
    if (dto.description !== undefined) project.description = dto.description || null;
    if (dto.status !== undefined) project.status = dto.status;
    if (dto.ownerId !== undefined) project.ownerId = dto.ownerId;
    if (dto.startDate !== undefined) project.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.targetEndDate !== undefined) project.targetEndDate = dto.targetEndDate ? new Date(dto.targetEndDate) : null;
    if (dto.objectId !== undefined) project.objectId = dto.objectId || null;

    return this.projectRepo.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    await this.taskRepo.delete({ projectId: id });
    await this.projectRepo.remove(project);
  }

  // Milestones

  async createMilestone(projectId: string, dto: CreateMilestoneDto): Promise<ProjectMilestone> {
    await this.findOne(projectId); // ensure project exists
    const milestone = this.milestoneRepo.create({
      projectId,
      title: dto.title,
      description: dto.description || null,
      status: dto.status,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      order: dto.order ?? 0,
    });
    return this.milestoneRepo.save(milestone);
  }

  async updateMilestone(projectId: string, milestoneId: string, dto: UpdateMilestoneDto): Promise<ProjectMilestone> {
    const milestone = await this.milestoneRepo.findOne({
      where: { id: milestoneId, projectId },
    });
    if (!milestone) {
      throw new NotFoundException(`Milestone ${milestoneId} not found in project ${projectId}`);
    }

    if (dto.title !== undefined) milestone.title = dto.title;
    if (dto.description !== undefined) milestone.description = dto.description || null;
    if (dto.status !== undefined) milestone.status = dto.status;
    if (dto.dueDate !== undefined) milestone.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.order !== undefined) milestone.order = dto.order;

    return this.milestoneRepo.save(milestone);
  }

  async removeMilestone(projectId: string, milestoneId: string): Promise<void> {
    const milestone = await this.milestoneRepo.findOne({
      where: { id: milestoneId, projectId },
    });
    if (!milestone) {
      throw new NotFoundException(`Milestone ${milestoneId} not found in project ${projectId}`);
    }
    await this.milestoneRepo.remove(milestone);
  }

  // Project tasks

  async findProjectTasks(projectId: string): Promise<Task[]> {
    await this.findOne(projectId);
    return this.taskRepo.find({
      where: { projectId },
      relations: ['object'],
      order: { createdAt: 'DESC' },
    });
  }

  // Project stats

  async getStats(projectId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    percentComplete: number;
  }> {
    await this.findOne(projectId);
    const tasks = await this.taskRepo.find({ where: { projectId } });
    const total = tasks.length;
    const byStatus: Record<string, number> = {};

    for (const t of tasks) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    }

    const done = byStatus[TaskStatus.Done] || 0;
    const percentComplete = total > 0 ? Math.round((done / total) * 100) : 0;

    return { total, byStatus, percentComplete };
  }
}
