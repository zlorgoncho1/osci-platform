import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SecurityProject } from './entities/security-project.entity';
import { ProjectMilestone } from './entities/project-milestone.entity';
import { ProjectConcerned } from './entities/project-concerned.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { ProjectStatus, TaskStatus, ResourceType } from '../../common/enums';
import { AuthorizationService } from '../rbac/authorization.service';
import { ResourceAccessService } from '../rbac/resource-access.service';

export interface UserSummary {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(SecurityProject)
    private readonly projectRepo: Repository<SecurityProject>,
    @InjectRepository(ProjectMilestone)
    private readonly milestoneRepo: Repository<ProjectMilestone>,
    @InjectRepository(ProjectConcerned)
    private readonly concernedRepo: Repository<ProjectConcerned>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly authorizationService: AuthorizationService,
    private readonly resourceAccessService: ResourceAccessService,
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

  // --- findAll with owner resolution & concernedUserId filter ---

  async findAll(
    userId: string,
    filters?: { status?: ProjectStatus; ownerId?: string; concernedUserId?: string },
  ): Promise<any[]> {
    const accessibleIds = await this.authorizationService.getAccessibleResourceIds(
      userId,
      ResourceType.Project,
    );

    const qb = this.projectRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.milestones', 'milestones')
      .orderBy('p.createdAt', 'DESC');

    if (accessibleIds !== 'all') {
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

    // Filter: projects where the user is owner OR concerned
    if (filters?.concernedUserId) {
      const cuid = filters.concernedUserId;
      qb.andWhere(
        `(p.ownerId = :cuid OR p.id IN (SELECT pc."projectId" FROM project_concerned pc WHERE pc."userId" = :cuid))`,
        { cuid },
      );
    }

    const projects = await qb.getMany();

    // Resolve owner users
    const ownerIds = projects.map((p) => p.ownerId).filter(Boolean);
    const userMap = await this.resolveUsers(ownerIds);

    return projects.map((p) => ({
      ...p,
      owner: userMap[p.ownerId] || null,
    }));
  }

  // --- findOne with owner + concerned resolution ---

  async findOne(id: string): Promise<any> {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['milestones', 'object'],
    });
    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }

    // Resolve owner
    const concerned = await this.concernedRepo.find({ where: { projectId: id } });
    const allUserIds = [project.ownerId, ...concerned.map((c) => c.userId)].filter(Boolean);
    const userMap = await this.resolveUsers(allUserIds);

    return {
      ...project,
      owner: userMap[project.ownerId] || null,
      concerned: concerned.map((c) => userMap[c.userId] || { id: c.userId, email: '', firstName: null, lastName: null }),
    };
  }

  async create(dto: CreateProjectDto, userId: string): Promise<SecurityProject> {
    await this.validateUserExists(dto.ownerId, 'ownerId');

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

    await this.resourceAccessService.createCreatorAccess(
      ResourceType.Project,
      saved.id,
      userId,
    );

    return saved;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<any> {
    const project = await this.projectRepo.findOne({ where: { id }, relations: ['milestones', 'object'] });
    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }

    if (dto.ownerId !== undefined) {
      await this.validateUserExists(dto.ownerId, 'ownerId');
    }

    if (dto.name !== undefined) project.name = dto.name;
    if (dto.description !== undefined) project.description = dto.description || null;
    if (dto.status !== undefined) project.status = dto.status;
    if (dto.ownerId !== undefined) project.ownerId = dto.ownerId;
    if (dto.startDate !== undefined) project.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.targetEndDate !== undefined) project.targetEndDate = dto.targetEndDate ? new Date(dto.targetEndDate) : null;
    if (dto.objectId !== undefined) project.objectId = dto.objectId || null;

    const saved = await this.projectRepo.save(project);

    // Return with resolved owner
    const userMap = await this.resolveUsers([saved.ownerId].filter(Boolean));
    return { ...saved, owner: userMap[saved.ownerId] || null };
  }

  async remove(id: string): Promise<void> {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }
    await this.concernedRepo.delete({ projectId: id });
    await this.taskRepo.delete({ projectId: id });
    await this.projectRepo.remove(project);
  }

  // --- Concerned ---

  async getConcerned(projectId: string): Promise<UserSummary[]> {
    await this.findOneRaw(projectId);
    const concerned = await this.concernedRepo.find({ where: { projectId } });
    const userMap = await this.resolveUsers(concerned.map((c) => c.userId));
    return concerned.map((c) => userMap[c.userId] || { id: c.userId, email: '', firstName: null, lastName: null });
  }

  async addConcerned(projectId: string, userIds: string[]): Promise<UserSummary[]> {
    await this.findOneRaw(projectId);
    for (const uid of userIds) {
      await this.validateUserExists(uid, 'userId');
    }

    for (const uid of userIds) {
      const exists = await this.concernedRepo.findOne({ where: { projectId, userId: uid } });
      if (!exists) {
        await this.concernedRepo.save(this.concernedRepo.create({ projectId, userId: uid }));
      }
    }

    return this.getConcerned(projectId);
  }

  async removeConcerned(projectId: string, userId: string): Promise<void> {
    await this.findOneRaw(projectId);
    await this.concernedRepo.delete({ projectId, userId });
  }

  // --- Milestones ---

  async createMilestone(projectId: string, dto: CreateMilestoneDto): Promise<ProjectMilestone> {
    await this.findOneRaw(projectId);
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

  // --- Project tasks (with user resolution) ---

  async findProjectTasks(projectId: string): Promise<any[]> {
    await this.findOneRaw(projectId);
    const tasks = await this.taskRepo.find({
      where: { projectId },
      relations: ['object', 'children'],
      order: { createdAt: 'DESC' },
    });

    const userIds = tasks.flatMap((t) => [t.assignedToId, t.leadId]).filter(Boolean) as string[];
    const userMap = await this.resolveUsers(userIds);

    return tasks.map((t) => ({
      ...t,
      assignedTo: t.assignedToId ? userMap[t.assignedToId] || null : null,
      lead: t.leadId ? userMap[t.leadId] || null : null,
    }));
  }

  // --- Project stats ---

  async getStats(projectId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    percentComplete: number;
  }> {
    await this.findOneRaw(projectId);
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

  // --- Private: raw findOne without resolution (for internal checks) ---

  private async findOneRaw(id: string): Promise<SecurityProject> {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }
    return project;
  }
}
