import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from '../tasks.controller';
import { TasksService } from '../tasks.service';
import { TaskCommentsService } from '../task-comments.service';
import { TaskStatus, Criticality } from '../../../common/enums';

describe('TasksController', () => {
  let controller: TasksController;
  let tasksService: Record<string, jest.Mock>;
  let commentsService: Record<string, jest.Mock>;

  beforeEach(async () => {
    tasksService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    commentsService = {
      findByTask: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        { provide: TasksService, useValue: tasksService },
        { provide: TaskCommentsService, useValue: commentsService },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ──────────────────────────────────────────
  // Tasks CRUD
  // ──────────────────────────────────────────
  describe('findAll', () => {
    it('should pass all query params to service', async () => {
      tasksService.findAll!.mockResolvedValue([]);
      await controller.findAll(TaskStatus.InProgress, 'user-1', 'obj-1', 'proj-1', 'parent-1');
      expect(tasksService.findAll).toHaveBeenCalledWith({
        status: TaskStatus.InProgress,
        assignedToId: 'user-1',
        objectId: 'obj-1',
        projectId: 'proj-1',
        parentTaskId: 'parent-1',
      });
    });

    it('should handle undefined filters', async () => {
      tasksService.findAll!.mockResolvedValue([]);
      await controller.findAll(undefined, undefined, undefined, undefined, undefined);
      expect(tasksService.findAll).toHaveBeenCalledWith({
        status: undefined,
        assignedToId: undefined,
        objectId: undefined,
        projectId: undefined,
        parentTaskId: undefined,
      });
    });
  });

  describe('create', () => {
    it('should create task with new fields', async () => {
      const dto = {
        title: 'New',
        objectId: 'obj-1',
        projectId: 'proj-1',
        parentTaskId: 'parent-1',
        labels: ['urgent'],
      } as any;
      const task = { id: 'new-id', ...dto } as any;
      tasksService.create!.mockResolvedValue(task);

      const result = await controller.create(dto);
      expect(result).toEqual(task);
    });
  });

  describe('findOne', () => {
    it('should return task by id', async () => {
      const task = { id: 'uuid-1', title: 'T' } as any;
      tasksService.findOne!.mockResolvedValue(task);
      const result = await controller.findOne('uuid-1');
      expect(result).toEqual(task);
    });
  });

  describe('update', () => {
    it('should update task', async () => {
      const dto = { status: TaskStatus.Done, labels: ['done'] } as any;
      const updated = { id: 'uuid-1', ...dto } as any;
      tasksService.update!.mockResolvedValue(updated);

      const result = await controller.update('uuid-1', dto);
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should remove task', async () => {
      tasksService.remove!.mockResolvedValue(undefined);
      await controller.remove('uuid-1');
      expect(tasksService.remove).toHaveBeenCalledWith('uuid-1');
    });
  });

  // ──────────────────────────────────────────
  // Comments
  // ──────────────────────────────────────────
  describe('getComments', () => {
    it('should return comments for a task', async () => {
      const comments = [{ id: 'c1', content: 'Hi' }] as any;
      commentsService.findByTask!.mockResolvedValue(comments);

      const result = await controller.getComments('task-1');
      expect(result).toEqual(comments);
      expect(commentsService.findByTask).toHaveBeenCalledWith('task-1');
    });
  });

  describe('createComment', () => {
    it('should create a comment for a task with author inferred from user', async () => {
      const dto = { content: 'Note' };
      const user = { sub: 'u1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' };
      const comment = { id: 'c-new', taskId: 'task-1', authorId: 'u1', authorName: 'John Doe', content: 'Note' } as any;
      commentsService.create!.mockResolvedValue(comment);

      const result = await controller.createComment('task-1', dto, user);
      expect(result).toEqual(comment);
      expect(commentsService.create).toHaveBeenCalledWith('task-1', {
        content: 'Note',
        authorId: 'u1',
        authorName: 'John Doe',
      });
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      commentsService.remove!.mockResolvedValue(undefined);
      await controller.deleteComment('comment-1');
      expect(commentsService.remove).toHaveBeenCalledWith('comment-1');
    });
  });
});
