import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
// Repository not imported directly - using mock type
import { TasksService } from '../tasks.service';
import { Task } from '../entities/task.entity';
import { TaskStatus, Criticality } from '../../../common/enums';

type MockRepository = Partial<Record<string, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('TasksService', () => {
  let service: TasksService;
  let repo: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: createMockRepository() },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    repo = module.get(getRepositoryToken(Task));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ──────────────────────────────────────────
  // findAll
  // ──────────────────────────────────────────
  describe('findAll', () => {
    it('should return all tasks without filters', async () => {
      const tasks = [{ id: '1', title: 'T1' }];
      repo.find!.mockResolvedValue(tasks);

      const result = await service.findAll();
      expect(result).toEqual(tasks);
      expect(repo.find).toHaveBeenCalledWith({
        where: {},
        relations: ['object', 'project', 'children'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should filter by status', async () => {
      repo.find!.mockResolvedValue([]);
      await service.findAll({ status: TaskStatus.InProgress });
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: TaskStatus.InProgress } }),
      );
    });

    it('should filter by projectId', async () => {
      repo.find!.mockResolvedValue([]);
      await service.findAll({ projectId: 'proj-uuid' });
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { projectId: 'proj-uuid' } }),
      );
    });

    it('should filter by parentTaskId', async () => {
      repo.find!.mockResolvedValue([]);
      await service.findAll({ parentTaskId: 'parent-uuid' });
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { parentTaskId: 'parent-uuid' } }),
      );
    });

    it('should filter by assignedToId', async () => {
      repo.find!.mockResolvedValue([]);
      await service.findAll({ assignedToId: 'user-123' });
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { assignedToId: 'user-123' } }),
      );
    });

    it('should apply multiple filters simultaneously', async () => {
      repo.find!.mockResolvedValue([]);
      await service.findAll({ status: TaskStatus.ToDo, projectId: 'proj-1', objectId: 'obj-1' });
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: TaskStatus.ToDo, projectId: 'proj-1', objectId: 'obj-1' },
        }),
      );
    });
  });

  // ──────────────────────────────────────────
  // findOne
  // ──────────────────────────────────────────
  describe('findOne', () => {
    it('should return a task by id', async () => {
      const task = { id: 'uuid-1', title: 'Test Task' };
      repo.findOne!.mockResolvedValue(task);

      const result = await service.findOne('uuid-1');
      expect(result).toEqual(task);
    });

    it('should throw NotFoundException when task not found', async () => {
      repo.findOne!.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────
  // create
  // ──────────────────────────────────────────
  describe('create', () => {
    it('should create a task with projectId, parentTaskId, labels', async () => {
      const dto = {
        title: 'New Task',
        objectId: 'obj-1',
        projectId: 'proj-1',
        parentTaskId: 'parent-1',
        labels: ['security', 'urgent'],
        priority: Criticality.High,
      };
      const created = { id: 'new-uuid', ...dto };
      repo.create!.mockReturnValue(created);
      repo.save!.mockResolvedValue(created);

      const result = await service.create(dto);
      expect(result).toEqual(created);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'proj-1',
          parentTaskId: 'parent-1',
          labels: ['security', 'urgent'],
        }),
      );
    });

    it('should create a task with null optional fields', async () => {
      const dto = { title: 'Basic Task', objectId: 'obj-1' };
      const created = { id: 'uuid', ...dto };
      repo.create!.mockReturnValue(created);
      repo.save!.mockResolvedValue(created);

      await service.create(dto);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: null,
          parentTaskId: null,
          labels: null,
        }),
      );
    });
  });

  // ──────────────────────────────────────────
  // update
  // ──────────────────────────────────────────
  describe('update', () => {
    const existing = {
      id: 'uuid-1',
      title: 'Old',
      description: null,
      status: TaskStatus.ToDo,
      priority: Criticality.Medium,
      assignedToId: null,
      slaDue: null,
      projectId: null,
      parentTaskId: null,
      labels: null,
    };

    it('should update projectId', async () => {
      repo.findOne!.mockResolvedValue({ ...existing });
      repo.save!.mockImplementation((t) => Promise.resolve(t));

      const result = await service.update('uuid-1', { projectId: 'proj-new' });
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'proj-new' }));
    });

    it('should update parentTaskId', async () => {
      repo.findOne!.mockResolvedValue({ ...existing });
      repo.save!.mockImplementation((t) => Promise.resolve(t));

      await service.update('uuid-1', { parentTaskId: 'parent-new' });
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ parentTaskId: 'parent-new' }));
    });

    it('should update labels', async () => {
      repo.findOne!.mockResolvedValue({ ...existing });
      repo.save!.mockImplementation((t) => Promise.resolve(t));

      await service.update('uuid-1', { labels: ['tag1', 'tag2'] });
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ labels: ['tag1', 'tag2'] }));
    });

    it('should clear projectId when set to empty string', async () => {
      repo.findOne!.mockResolvedValue({ ...existing, projectId: 'old-proj' });
      repo.save!.mockImplementation((t) => Promise.resolve(t));

      await service.update('uuid-1', { projectId: '' as any });
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ projectId: null }));
    });

    it('should throw NotFoundException for invalid id', async () => {
      repo.findOne!.mockResolvedValue(null);
      await expect(service.update('bad', { title: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────
  // remove
  // ──────────────────────────────────────────
  describe('remove', () => {
    it('should remove a task', async () => {
      const task = { id: 'uuid-del', title: 'T' };
      repo.findOne!.mockResolvedValue(task);
      repo.remove!.mockResolvedValue(task);

      await service.remove('uuid-del');
      expect(repo.remove).toHaveBeenCalledWith(task);
    });

    it('should throw NotFoundException for invalid id', async () => {
      repo.findOne!.mockResolvedValue(null);
      await expect(service.remove('bad')).rejects.toThrow(NotFoundException);
    });
  });
});
