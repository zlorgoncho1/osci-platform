import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, getMetadataArgsStorage } from 'typeorm';
import request from 'supertest';
import { ProjectsModule } from '../src/modules/projects/projects.module';
import { TasksModule } from '../src/modules/tasks/tasks.module';
import { SecurityProject } from '../src/modules/projects/entities/security-project.entity';
import { ProjectMilestone } from '../src/modules/projects/entities/project-milestone.entity';
import { Task } from '../src/modules/tasks/entities/task.entity';
import { TaskComment } from '../src/modules/tasks/entities/task-comment.entity';
import { SecObject } from '../src/modules/objects/entities/object.entity';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { ProjectStatus, Criticality, ObjectType } from '../src/common/enums';

/**
 * Patch TypeORM metadata so enum/json columns work with SQLite.
 * SQLite doesn't support enum or json types natively.
 */
function patchMetadataForSqlite(): void {
  const columns = getMetadataArgsStorage().columns;
  for (const col of columns) {
    const opts = col.options as any;
    if (opts.type === 'enum') {
      opts.type = 'text';
      delete opts.enum;
    }
    if (opts.type === 'json') {
      opts.type = 'simple-json';
    }
  }
}

/**
 * Integration tests for Security Projects system.
 * Uses SQLite in-memory database, no JWT guard (overridden).
 */
describe('Projects & Tasks Integration (e2e)', () => {
  let app: INestApplication;
  let objectId: string;

  beforeAll(async () => {
    // Patch enum/json columns for SQLite compatibility
    patchMetadataForSqlite();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [SecurityProject, ProjectMilestone, Task, TaskComment, SecObject],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([SecObject]),
        ProjectsModule,
        TasksModule,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Seed a SecObject to use as FK
    const ds = moduleFixture.get(DataSource);
    const objRepo = ds.getRepository(SecObject);
    const obj = objRepo.create({
      type: ObjectType.Project as any,
      name: 'Test Object',
      description: null,
      metadata: null,
      parentId: null,
    });
    const saved = await objRepo.save(obj);
    objectId = saved.id;
  });

  afterAll(async () => {
    await app?.close();
  });

  // ──────────────────────────────────────────
  // Projects CRUD
  // ──────────────────────────────────────────
  let projectId: string;

  describe('POST /projects', () => {
    it('should create a project', async () => {
      const res = await request(app.getHttpServer())
        .post('/projects')
        .send({
          name: 'Integration Test Project',
          ownerId: 'test-owner',
          description: 'Test description',
          status: ProjectStatus.Active,
          startDate: '2026-01-01',
          targetEndDate: '2026-06-30',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Integration Test Project');
      expect(res.body.status).toBe(ProjectStatus.Active);
      projectId = res.body.id;
    });

    it('should fail without required name', async () => {
      await request(app.getHttpServer())
        .post('/projects')
        .send({ ownerId: 'test' })
        .expect(400);
    });
  });

  describe('GET /projects', () => {
    it('should list projects', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects?status=Active')
        .expect(200);

      expect(res.body.every((p: any) => p.status === 'Active')).toBe(true);
    });
  });

  describe('GET /projects/:id', () => {
    it('should return project detail with milestones', async () => {
      const res = await request(app.getHttpServer())
        .get(`/projects/${projectId}`)
        .expect(200);

      expect(res.body.id).toBe(projectId);
      expect(res.body.milestones).toBeDefined();
    });

    it('should 404 for non-existent project', async () => {
      await request(app.getHttpServer())
        .get('/projects/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('PATCH /projects/:id', () => {
    it('should update a project', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/projects/${projectId}`)
        .send({ name: 'Updated Name', status: ProjectStatus.OnHold })
        .expect(200);

      expect(res.body.name).toBe('Updated Name');
      expect(res.body.status).toBe(ProjectStatus.OnHold);
    });
  });

  // ──────────────────────────────────────────
  // Milestones
  // ──────────────────────────────────────────
  let milestoneId: string;

  describe('POST /projects/:id/milestones', () => {
    it('should create a milestone', async () => {
      const res = await request(app.getHttpServer())
        .post(`/projects/${projectId}/milestones`)
        .send({ title: 'Phase 1', description: 'First phase', dueDate: '2026-03-15', order: 0 })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('Phase 1');
      milestoneId = res.body.id;
    });
  });

  describe('PATCH /projects/:id/milestones/:mid', () => {
    it('should update a milestone status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/projects/${projectId}/milestones/${milestoneId}`)
        .send({ status: 'Completed' })
        .expect(200);

      expect(res.body.status).toBe('Completed');
    });
  });

  // ──────────────────────────────────────────
  // Tasks with project context
  // ──────────────────────────────────────────
  let taskId: string;

  describe('POST /tasks (with projectId)', () => {
    it('should create a task linked to project', async () => {
      const res = await request(app.getHttpServer())
        .post('/tasks')
        .send({
          title: 'Fix vulnerability',
          objectId,
          projectId,
          priority: Criticality.High,
          labels: ['security', 'critical'],
        })
        .expect(201);

      expect(res.body.projectId).toBe(projectId);
      taskId = res.body.id;
    });
  });

  describe('GET /tasks?projectId=', () => {
    it('should filter tasks by project', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tasks?projectId=${projectId}`)
        .expect(200);

      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].projectId).toBe(projectId);
    });
  });

  describe('Sub-tasks', () => {
    it('should create a sub-task', async () => {
      const res = await request(app.getHttpServer())
        .post('/tasks')
        .send({
          title: 'Sub-task: patch library',
          objectId,
          projectId,
          parentTaskId: taskId,
        })
        .expect(201);

      expect(res.body.parentTaskId).toBe(taskId);
    });
  });

  // ──────────────────────────────────────────
  // Task Comments
  // ──────────────────────────────────────────
  let commentId: string;

  describe('POST /tasks/:id/comments', () => {
    it('should add a comment to a task', async () => {
      const res = await request(app.getHttpServer())
        .post(`/tasks/${taskId}/comments`)
        .send({ authorId: 'user-1', authorName: 'Test User', content: 'This needs review' })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.content).toBe('This needs review');
      commentId = res.body.id;
    });
  });

  describe('GET /tasks/:id/comments', () => {
    it('should return comments for a task', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tasks/${taskId}/comments`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('DELETE /tasks/:taskId/comments/:commentId', () => {
    it('should delete a comment', async () => {
      await request(app.getHttpServer())
        .delete(`/tasks/${taskId}/comments/${commentId}`)
        .expect(200);
    });
  });

  // ──────────────────────────────────────────
  // Project Stats
  // ──────────────────────────────────────────
  describe('GET /projects/:id/stats', () => {
    it('should return stats with task counts', async () => {
      const res = await request(app.getHttpServer())
        .get(`/projects/${projectId}/stats`)
        .expect(200);

      expect(res.body.total).toBeGreaterThanOrEqual(1);
      expect(res.body.percentComplete).toBeDefined();
      expect(res.body.byStatus).toBeDefined();
    });
  });

  describe('GET /projects/:id/tasks', () => {
    it('should return project tasks', async () => {
      const res = await request(app.getHttpServer())
        .get(`/projects/${projectId}/tasks`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ──────────────────────────────────────────
  // Cleanup
  // ──────────────────────────────────────────
  describe('DELETE /projects/:id/milestones/:mid', () => {
    it('should delete a milestone', async () => {
      await request(app.getHttpServer())
        .delete(`/projects/${projectId}/milestones/${milestoneId}`)
        .expect(200);
    });
  });

  describe('DELETE /projects/:id', () => {
    it('should delete the project', async () => {
      await request(app.getHttpServer())
        .delete(`/projects/${projectId}`)
        .expect(200);
    });
  });
});
