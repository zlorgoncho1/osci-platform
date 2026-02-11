import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ──────────────────────────────────────────
  // Projects
  // ──────────────────────────────────────────
  describe('Projects API', () => {
    it('getProjects should GET /projects', () => {
      const mockProjects = [{ id: '1', name: 'P1' }];
      service.getProjects().subscribe(data => {
        expect(data).toEqual(mockProjects);
      });
      const req = httpMock.expectOne(r => r.url.includes('/projects'));
      expect(req.request.method).toBe('GET');
      req.flush(mockProjects);
    });

    it('getProjects with params should pass query params', () => {
      service.getProjects({ status: 'Active' }).subscribe();
      const req = httpMock.expectOne(r => r.url.includes('/projects') && r.params.get('status') === 'Active');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('getProject should GET /projects/:id', () => {
      service.getProject('uuid-1').subscribe(data => {
        expect(data.id).toBe('uuid-1');
      });
      const req = httpMock.expectOne(r => r.url.includes('/projects/uuid-1'));
      expect(req.request.method).toBe('GET');
      req.flush({ id: 'uuid-1', name: 'P1' });
    });

    it('createProject should POST /projects', () => {
      const payload = { name: 'New', ownerId: 'o1' };
      service.createProject(payload).subscribe(data => {
        expect(data.id).toBeDefined();
      });
      const req = httpMock.expectOne(r => r.url.includes('/projects'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ id: 'new-id', ...payload });
    });

    it('updateProject should PATCH /projects/:id', () => {
      service.updateProject('uuid-1', { name: 'Updated' }).subscribe();
      const req = httpMock.expectOne(r => r.url.includes('/projects/uuid-1'));
      expect(req.request.method).toBe('PATCH');
      req.flush({ id: 'uuid-1', name: 'Updated' });
    });

    it('deleteProject should DELETE /projects/:id', () => {
      service.deleteProject('uuid-1').subscribe();
      const req = httpMock.expectOne(r => r.url.includes('/projects/uuid-1'));
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('getProjectStats should GET /projects/:id/stats', () => {
      service.getProjectStats('uuid-1').subscribe(data => {
        expect(data.total).toBe(5);
      });
      const req = httpMock.expectOne(r => r.url.includes('/projects/uuid-1/stats'));
      expect(req.request.method).toBe('GET');
      req.flush({ total: 5, byStatus: {}, percentComplete: 40 });
    });

    it('getProjectTasks should GET /projects/:id/tasks', () => {
      service.getProjectTasks('uuid-1').subscribe(data => {
        expect(data.length).toBe(1);
      });
      const req = httpMock.expectOne(r => r.url.includes('/projects/uuid-1/tasks'));
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 't1' }]);
    });
  });

  // ──────────────────────────────────────────
  // Milestones
  // ──────────────────────────────────────────
  describe('Milestones API', () => {
    it('createMilestone should POST /projects/:id/milestones', () => {
      service.createMilestone('proj-1', { title: 'M1' }).subscribe();
      const req = httpMock.expectOne(r => r.url.includes('/projects/proj-1/milestones'));
      expect(req.request.method).toBe('POST');
      req.flush({ id: 'ms-1' });
    });

    it('updateMilestone should PATCH /projects/:id/milestones/:mid', () => {
      service.updateMilestone('proj-1', 'ms-1', { status: 'Completed' }).subscribe();
      const req = httpMock.expectOne(r => r.url.includes('/projects/proj-1/milestones/ms-1'));
      expect(req.request.method).toBe('PATCH');
      req.flush({ id: 'ms-1', status: 'Completed' });
    });

    it('deleteMilestone should DELETE /projects/:id/milestones/:mid', () => {
      service.deleteMilestone('proj-1', 'ms-1').subscribe();
      const req = httpMock.expectOne(r => r.url.includes('/projects/proj-1/milestones/ms-1'));
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  // ──────────────────────────────────────────
  // Task Comments
  // ──────────────────────────────────────────
  describe('Task Comments API', () => {
    it('getTaskComments should GET /tasks/:id/comments', () => {
      service.getTaskComments('task-1').subscribe(data => {
        expect(data.length).toBe(2);
      });
      const req = httpMock.expectOne(r => r.url.includes('/tasks/task-1/comments'));
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 'c1' }, { id: 'c2' }]);
    });

    it('createTaskComment should POST /tasks/:id/comments', () => {
      const payload = { authorId: 'u1', authorName: 'User', content: 'Note' };
      service.createTaskComment('task-1', payload).subscribe();
      const req = httpMock.expectOne(r => r.url.includes('/tasks/task-1/comments'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ id: 'c-new', ...payload });
    });

    it('deleteTaskComment should DELETE /tasks/:taskId/comments/:commentId', () => {
      service.deleteTaskComment('task-1', 'c-1').subscribe();
      const req = httpMock.expectOne(r => r.url.includes('/tasks/task-1/comments/c-1'));
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });
});
