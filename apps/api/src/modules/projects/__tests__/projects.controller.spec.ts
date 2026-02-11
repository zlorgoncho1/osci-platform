import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from '../projects.controller';
import { ProjectsService } from '../projects.service';
import { ProjectStatus, MilestoneStatus } from '../../../common/enums';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: Record<string, jest.Mock>;

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      createMilestone: jest.fn(),
      updateMilestone: jest.fn(),
      removeMilestone: jest.fn(),
      findProjectTasks: jest.fn(),
      getStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [{ provide: ProjectsService, useValue: service }],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ──────────────────────────────────────────
  // Projects CRUD
  // ──────────────────────────────────────────
  describe('findAll', () => {
    it('should call service.findAll with filters', async () => {
      service.findAll!.mockResolvedValue([]);
      await controller.findAll(ProjectStatus.Active, 'owner-1');
      expect(service.findAll).toHaveBeenCalledWith({ status: ProjectStatus.Active, ownerId: 'owner-1' });
    });

    it('should call service.findAll without filters', async () => {
      service.findAll!.mockResolvedValue([]);
      await controller.findAll(undefined, undefined);
      expect(service.findAll).toHaveBeenCalledWith({ status: undefined, ownerId: undefined });
    });
  });

  describe('findOne', () => {
    it('should return project by id', async () => {
      const project = { id: 'uuid-1', name: 'P1' } as any;
      service.findOne!.mockResolvedValue(project);
      const result = await controller.findOne('uuid-1');
      expect(result).toEqual(project);
    });
  });

  describe('create', () => {
    it('should create a project', async () => {
      const dto = { name: 'New', ownerId: 'o1' } as any;
      const created = { id: 'new-id', ...dto } as any;
      service.create!.mockResolvedValue(created);

      const result = await controller.create(dto);
      expect(result).toEqual(created);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const dto = { name: 'Updated' } as any;
      const updated = { id: 'uuid-1', name: 'Updated' } as any;
      service.update!.mockResolvedValue(updated);

      const result = await controller.update('uuid-1', dto);
      expect(result).toEqual(updated);
      expect(service.update).toHaveBeenCalledWith('uuid-1', dto);
    });
  });

  describe('remove', () => {
    it('should remove a project', async () => {
      service.remove!.mockResolvedValue(undefined);
      await controller.remove('uuid-1');
      expect(service.remove).toHaveBeenCalledWith('uuid-1');
    });
  });

  // ──────────────────────────────────────────
  // Milestones
  // ──────────────────────────────────────────
  describe('createMilestone', () => {
    it('should create a milestone', async () => {
      const dto = { title: 'M1' } as any;
      const ms = { id: 'ms-1', projectId: 'proj-1', title: 'M1' } as any;
      service.createMilestone!.mockResolvedValue(ms);

      const result = await controller.createMilestone('proj-1', dto);
      expect(result).toEqual(ms);
      expect(service.createMilestone).toHaveBeenCalledWith('proj-1', dto);
    });
  });

  describe('updateMilestone', () => {
    it('should update a milestone', async () => {
      const dto = { status: MilestoneStatus.Completed } as any;
      const ms = { id: 'ms-1', status: MilestoneStatus.Completed } as any;
      service.updateMilestone!.mockResolvedValue(ms);

      const result = await controller.updateMilestone('proj-1', 'ms-1', dto);
      expect(result).toEqual(ms);
      expect(service.updateMilestone).toHaveBeenCalledWith('proj-1', 'ms-1', dto);
    });
  });

  describe('removeMilestone', () => {
    it('should remove a milestone', async () => {
      service.removeMilestone!.mockResolvedValue(undefined);
      await controller.removeMilestone('proj-1', 'ms-1');
      expect(service.removeMilestone).toHaveBeenCalledWith('proj-1', 'ms-1');
    });
  });

  // ──────────────────────────────────────────
  // Tasks & Stats
  // ──────────────────────────────────────────
  describe('findProjectTasks', () => {
    it('should return tasks for project', async () => {
      const tasks = [{ id: 't1', title: 'Task' }] as any[];
      service.findProjectTasks!.mockResolvedValue(tasks);

      const result = await controller.findProjectTasks('proj-1');
      expect(result).toEqual(tasks);
    });
  });

  describe('getStats', () => {
    it('should return project stats', async () => {
      const stats = { total: 4, byStatus: { Done: 2, ToDo: 2 }, percentComplete: 50 };
      service.getStats!.mockResolvedValue(stats);

      const result = await controller.getStats('proj-1');
      expect(result).toEqual(stats);
    });
  });
});
