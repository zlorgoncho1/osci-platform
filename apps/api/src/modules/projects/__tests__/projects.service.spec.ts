import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
// Repository not imported directly - using mock type
import { ProjectsService } from '../projects.service';
import { SecurityProject } from '../entities/security-project.entity';
import { ProjectMilestone } from '../entities/project-milestone.entity';
import { Task } from '../../tasks/entities/task.entity';
import { ProjectStatus, MilestoneStatus, TaskStatus } from '../../../common/enums';

type MockRepository = Partial<Record<string, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectRepo: MockRepository;
  let milestoneRepo: MockRepository;
  let taskRepo: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: getRepositoryToken(SecurityProject), useValue: createMockRepository() },
        { provide: getRepositoryToken(ProjectMilestone), useValue: createMockRepository() },
        { provide: getRepositoryToken(Task), useValue: createMockRepository() },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    projectRepo = module.get(getRepositoryToken(SecurityProject));
    milestoneRepo = module.get(getRepositoryToken(ProjectMilestone));
    taskRepo = module.get(getRepositoryToken(Task));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ──────────────────────────────────────────
  // findAll
  // ──────────────────────────────────────────
  describe('findAll', () => {
    it('should return all projects without filters', async () => {
      const projects = [{ id: '1', name: 'P1' }, { id: '2', name: 'P2' }];
      projectRepo.find!.mockResolvedValue(projects);

      const result = await service.findAll();
      expect(result).toEqual(projects);
      expect(projectRepo.find).toHaveBeenCalledWith({
        where: {},
        relations: ['milestones'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should apply status filter', async () => {
      projectRepo.find!.mockResolvedValue([]);
      await service.findAll({ status: ProjectStatus.Active });
      expect(projectRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: ProjectStatus.Active },
        }),
      );
    });

    it('should apply ownerId filter', async () => {
      projectRepo.find!.mockResolvedValue([]);
      await service.findAll({ ownerId: 'user-123' });
      expect(projectRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ownerId: 'user-123' },
        }),
      );
    });

    it('should apply both filters', async () => {
      projectRepo.find!.mockResolvedValue([]);
      await service.findAll({ status: ProjectStatus.Planning, ownerId: 'user-456' });
      expect(projectRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: ProjectStatus.Planning, ownerId: 'user-456' },
        }),
      );
    });
  });

  // ──────────────────────────────────────────
  // findOne
  // ──────────────────────────────────────────
  describe('findOne', () => {
    it('should return a project by id', async () => {
      const project = { id: 'uuid-1', name: 'Test Project' };
      projectRepo.findOne!.mockResolvedValue(project);

      const result = await service.findOne('uuid-1');
      expect(result).toEqual(project);
      expect(projectRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        relations: ['milestones', 'object'],
      });
    });

    it('should throw NotFoundException when not found', async () => {
      projectRepo.findOne!.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────
  // create
  // ──────────────────────────────────────────
  describe('create', () => {
    it('should create a project with required fields', async () => {
      const dto = { name: 'New Project', ownerId: 'owner-1' };
      const created = { id: 'uuid-new', ...dto, status: ProjectStatus.Planning };
      projectRepo.create!.mockReturnValue(created);
      projectRepo.save!.mockResolvedValue(created);

      const result = await service.create(dto);
      expect(result).toEqual(created);
      expect(projectRepo.create).toHaveBeenCalledWith({
        name: 'New Project',
        description: null,
        status: ProjectStatus.Planning,
        ownerId: 'owner-1',
        startDate: null,
        targetEndDate: null,
        objectId: null,
      });
    });

    it('should create a project with all fields', async () => {
      const dto = {
        name: 'Full Project',
        ownerId: 'owner-2',
        description: 'Desc',
        status: ProjectStatus.Active,
        startDate: '2026-01-01',
        targetEndDate: '2026-12-31',
        objectId: 'obj-uuid',
      };
      const created = { id: 'uuid-full', ...dto };
      projectRepo.create!.mockReturnValue(created);
      projectRepo.save!.mockResolvedValue(created);

      await service.create(dto);
      expect(projectRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Full Project',
          description: 'Desc',
          status: ProjectStatus.Active,
          ownerId: 'owner-2',
          objectId: 'obj-uuid',
        }),
      );
    });
  });

  // ──────────────────────────────────────────
  // update
  // ──────────────────────────────────────────
  describe('update', () => {
    it('should update project fields', async () => {
      const existing = {
        id: 'uuid-1',
        name: 'Old Name',
        description: null,
        status: ProjectStatus.Planning,
        ownerId: 'owner-1',
        startDate: null,
        targetEndDate: null,
        objectId: null,
      };
      projectRepo.findOne!.mockResolvedValue(existing);
      projectRepo.save!.mockResolvedValue({ ...existing, name: 'New Name', status: ProjectStatus.Active });

      const result = await service.update('uuid-1', { name: 'New Name', status: ProjectStatus.Active });
      expect(projectRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Name', status: ProjectStatus.Active }),
      );
    });

    it('should throw NotFoundException for invalid id', async () => {
      projectRepo.findOne!.mockResolvedValue(null);
      await expect(service.update('bad-id', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────
  // remove
  // ──────────────────────────────────────────
  describe('remove', () => {
    it('should remove a project', async () => {
      const project = { id: 'uuid-del', name: 'Delete Me' };
      projectRepo.findOne!.mockResolvedValue(project);
      projectRepo.remove!.mockResolvedValue(project);

      await service.remove('uuid-del');
      expect(projectRepo.remove).toHaveBeenCalledWith(project);
    });

    it('should throw NotFoundException for invalid id', async () => {
      projectRepo.findOne!.mockResolvedValue(null);
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────
  // Milestones
  // ──────────────────────────────────────────
  describe('createMilestone', () => {
    it('should create a milestone for existing project', async () => {
      const project = { id: 'proj-1', name: 'P1' };
      projectRepo.findOne!.mockResolvedValue(project);

      const dto = { title: 'M1', description: 'Desc', order: 1 };
      const created = { id: 'ms-1', projectId: 'proj-1', ...dto };
      milestoneRepo.create!.mockReturnValue(created);
      milestoneRepo.save!.mockResolvedValue(created);

      const result = await service.createMilestone('proj-1', dto);
      expect(result).toEqual(created);
      expect(milestoneRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 'proj-1', title: 'M1' }),
      );
    });

    it('should throw when project does not exist', async () => {
      projectRepo.findOne!.mockResolvedValue(null);
      await expect(service.createMilestone('bad-proj', { title: 'M' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMilestone', () => {
    it('should update milestone fields', async () => {
      const milestone = { id: 'ms-1', projectId: 'proj-1', title: 'Old', status: MilestoneStatus.Pending };
      milestoneRepo.findOne!.mockResolvedValue(milestone);
      milestoneRepo.save!.mockResolvedValue({ ...milestone, title: 'Updated', status: MilestoneStatus.Completed });

      const result = await service.updateMilestone('proj-1', 'ms-1', { title: 'Updated', status: MilestoneStatus.Completed });
      expect(milestoneRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Updated', status: MilestoneStatus.Completed }),
      );
    });

    it('should throw when milestone not found', async () => {
      milestoneRepo.findOne!.mockResolvedValue(null);
      await expect(service.updateMilestone('proj-1', 'bad-ms', { title: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeMilestone', () => {
    it('should remove an existing milestone', async () => {
      const milestone = { id: 'ms-1', projectId: 'proj-1' };
      milestoneRepo.findOne!.mockResolvedValue(milestone);
      milestoneRepo.remove!.mockResolvedValue(milestone);

      await service.removeMilestone('proj-1', 'ms-1');
      expect(milestoneRepo.remove).toHaveBeenCalledWith(milestone);
    });

    it('should throw when milestone not found', async () => {
      milestoneRepo.findOne!.mockResolvedValue(null);
      await expect(service.removeMilestone('proj-1', 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────
  // Project tasks
  // ──────────────────────────────────────────
  describe('findProjectTasks', () => {
    it('should return tasks for existing project', async () => {
      const project = { id: 'proj-1', name: 'P1' };
      projectRepo.findOne!.mockResolvedValue(project);
      const tasks = [{ id: 't1', title: 'Task 1' }];
      taskRepo.find!.mockResolvedValue(tasks);

      const result = await service.findProjectTasks('proj-1');
      expect(result).toEqual(tasks);
      expect(taskRepo.find).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
        relations: ['object'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  // ──────────────────────────────────────────
  // Stats
  // ──────────────────────────────────────────
  describe('getStats', () => {
    it('should compute correct percentComplete', async () => {
      const project = { id: 'proj-1', name: 'P1' };
      projectRepo.findOne!.mockResolvedValue(project);

      const tasks = [
        { id: '1', status: TaskStatus.Done },
        { id: '2', status: TaskStatus.Done },
        { id: '3', status: TaskStatus.InProgress },
        { id: '4', status: TaskStatus.ToDo },
      ];
      taskRepo.find!.mockResolvedValue(tasks);

      const result = await service.getStats('proj-1');
      expect(result.total).toBe(4);
      expect(result.percentComplete).toBe(50);
      expect(result.byStatus[TaskStatus.Done]).toBe(2);
      expect(result.byStatus[TaskStatus.InProgress]).toBe(1);
      expect(result.byStatus[TaskStatus.ToDo]).toBe(1);
    });

    it('should return 0% when no tasks', async () => {
      projectRepo.findOne!.mockResolvedValue({ id: 'proj-1' });
      taskRepo.find!.mockResolvedValue([]);

      const result = await service.getStats('proj-1');
      expect(result.total).toBe(0);
      expect(result.percentComplete).toBe(0);
      expect(result.byStatus).toEqual({});
    });

    it('should return 100% when all tasks done', async () => {
      projectRepo.findOne!.mockResolvedValue({ id: 'proj-1' });
      taskRepo.find!.mockResolvedValue([
        { id: '1', status: TaskStatus.Done },
        { id: '2', status: TaskStatus.Done },
      ]);

      const result = await service.getStats('proj-1');
      expect(result.percentComplete).toBe(100);
    });
  });
});
