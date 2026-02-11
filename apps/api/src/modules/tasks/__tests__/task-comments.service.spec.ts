import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
// Repository not imported directly - using mock type
import { TaskCommentsService } from '../task-comments.service';
import { TaskComment } from '../entities/task-comment.entity';

type MockRepository = Partial<Record<string, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('TaskCommentsService', () => {
  let service: TaskCommentsService;
  let repo: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskCommentsService,
        { provide: getRepositoryToken(TaskComment), useValue: createMockRepository() },
      ],
    }).compile();

    service = module.get<TaskCommentsService>(TaskCommentsService);
    repo = module.get(getRepositoryToken(TaskComment));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ──────────────────────────────────────────
  // findByTask
  // ──────────────────────────────────────────
  describe('findByTask', () => {
    it('should return comments for a task ordered by createdAt ASC', async () => {
      const comments = [
        { id: 'c1', content: 'First', createdAt: new Date('2026-01-01') },
        { id: 'c2', content: 'Second', createdAt: new Date('2026-01-02') },
      ];
      repo.find!.mockResolvedValue(comments);

      const result = await service.findByTask('task-1');
      expect(result).toEqual(comments);
      expect(repo.find).toHaveBeenCalledWith({
        where: { taskId: 'task-1' },
        order: { createdAt: 'ASC' },
      });
    });

    it('should return empty array when no comments', async () => {
      repo.find!.mockResolvedValue([]);
      const result = await service.findByTask('task-empty');
      expect(result).toEqual([]);
    });
  });

  // ──────────────────────────────────────────
  // create
  // ──────────────────────────────────────────
  describe('create', () => {
    it('should create a comment with all fields', async () => {
      const dto = { authorId: 'user-1', authorName: 'John', content: 'Hello' };
      const comment = { id: 'c-new', taskId: 'task-1', ...dto };
      repo.create!.mockReturnValue(comment);
      repo.save!.mockResolvedValue(comment);

      const result = await service.create('task-1', dto);
      expect(result).toEqual(comment);
      expect(repo.create).toHaveBeenCalledWith({
        taskId: 'task-1',
        authorId: 'user-1',
        authorName: 'John',
        content: 'Hello',
      });
    });
  });

  // ──────────────────────────────────────────
  // remove
  // ──────────────────────────────────────────
  describe('remove', () => {
    it('should remove an existing comment', async () => {
      const comment = { id: 'c-del', content: 'Delete me' };
      repo.findOne!.mockResolvedValue(comment);
      repo.remove!.mockResolvedValue(comment);

      await service.remove('c-del');
      expect(repo.remove).toHaveBeenCalledWith(comment);
    });

    it('should throw NotFoundException when comment not found', async () => {
      repo.findOne!.mockResolvedValue(null);
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
