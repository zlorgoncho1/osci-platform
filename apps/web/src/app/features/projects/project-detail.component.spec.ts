import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { ProjectDetailComponent } from './project-detail.component';
import { ApiService } from '../../core/services/api.service';

describe('ProjectDetailComponent', () => {
  let component: ProjectDetailComponent;
  let fixture: ComponentFixture<ProjectDetailComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;

  const mockProject = {
    id: 'proj-1',
    name: 'Test Project',
    description: 'Description',
    status: 'Active',
    ownerId: 'owner-1',
    startDate: '2026-01-01',
    targetEndDate: '2026-06-30',
    objectId: null,
    milestones: [
      { id: 'ms-1', title: 'Phase 1', status: 'Pending', dueDate: '2026-03-01', order: 0 },
      { id: 'ms-2', title: 'Phase 2', status: 'Completed', dueDate: '2026-05-01', order: 1 },
    ],
  };

  const mockTasks = [
    { id: 't1', title: 'Task 1', status: 'ToDo', priority: 'High', parentTaskId: null, children: [] },
    { id: 't2', title: 'Task 2', status: 'Done', priority: 'Medium', parentTaskId: null, children: [
      { id: 't3', title: 'Sub-task', status: 'ToDo', priority: 'Low', parentTaskId: 't2' },
    ]},
  ];

  const mockStats = { total: 3, byStatus: { ToDo: 2, Done: 1 }, percentComplete: 33 };

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', [
      'getProject', 'getProjectTasks', 'getProjectStats',
      'updateProject', 'createMilestone', 'updateMilestone', 'deleteMilestone',
      'createTask',
    ]);

    apiSpy.getProject.and.returnValue(of(mockProject));
    apiSpy.getProjectTasks.and.returnValue(of(mockTasks));
    apiSpy.getProjectStats.and.returnValue(of(mockStats));
    apiSpy.updateProject.and.returnValue(of(mockProject));
    apiSpy.createMilestone.and.returnValue(of({ id: 'ms-new' }));
    apiSpy.updateMilestone.and.returnValue(of({}));
    apiSpy.deleteMilestone.and.returnValue(of({}));
    apiSpy.createTask.and.returnValue(of({ id: 't-new' }));

    await TestBed.configureTestingModule({
      imports: [
        ProjectDetailComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'proj-1' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load project on init', () => {
    expect(apiSpy.getProject).toHaveBeenCalledWith('proj-1');
    expect(component.project).toBeTruthy();
    expect(component.project.name).toBe('Test Project');
  });

  it('should load milestones sorted by order', () => {
    expect(component.milestones.length).toBe(2);
    expect(component.milestones[0].title).toBe('Phase 1');
  });

  it('should load tasks', () => {
    expect(apiSpy.getProjectTasks).toHaveBeenCalledWith('proj-1');
    expect(component.tasks.length).toBe(2); // root tasks only
  });

  it('should load stats', () => {
    expect(apiSpy.getProjectStats).toHaveBeenCalledWith('proj-1');
    expect(component.stats.total).toBe(3);
    expect(component.stats.percentComplete).toBe(33);
  });

  it('should compute statusEntries from stats', () => {
    expect(component.statusEntries.length).toBe(2);
  });

  it('should start editing', () => {
    component.startEdit();
    expect(component.editing).toBeTrue();
    expect(component.editData.name).toBe('Test Project');
  });

  it('should save project', () => {
    component.startEdit();
    component.editData.name = 'New Name';
    component.saveProject();
    expect(apiSpy.updateProject).toHaveBeenCalledWith('proj-1', jasmine.objectContaining({ name: 'New Name' }));
  });

  it('should create milestone', () => {
    component.newMilestone = { title: 'M3', dueDate: '2026-07-01' };
    component.createMilestone();
    expect(apiSpy.createMilestone).toHaveBeenCalledWith('proj-1', jasmine.objectContaining({ title: 'M3' }));
  });

  it('should not create milestone without title', () => {
    component.newMilestone = { title: '', dueDate: '' };
    component.createMilestone();
    expect(apiSpy.createMilestone).not.toHaveBeenCalled();
  });

  it('should toggle milestone status', () => {
    component.toggleMilestoneStatus({ id: 'ms-1', status: 'Pending' });
    expect(apiSpy.updateMilestone).toHaveBeenCalledWith('proj-1', 'ms-1', { status: 'InProgress' });

    component.toggleMilestoneStatus({ id: 'ms-2', status: 'InProgress' });
    expect(apiSpy.updateMilestone).toHaveBeenCalledWith('proj-1', 'ms-2', { status: 'Completed' });

    component.toggleMilestoneStatus({ id: 'ms-3', status: 'Completed' });
    expect(apiSpy.updateMilestone).toHaveBeenCalledWith('proj-1', 'ms-3', { status: 'Pending' });
  });

  it('should delete milestone', () => {
    component.deleteMilestone('ms-1');
    expect(apiSpy.deleteMilestone).toHaveBeenCalledWith('proj-1', 'ms-1');
  });

  it('should create task with projectId pre-filled', () => {
    component.newTask = { title: 'New Task', priority: 'High' };
    component.createTask();
    expect(apiSpy.createTask).toHaveBeenCalledWith(
      jasmine.objectContaining({ title: 'New Task', projectId: 'proj-1' }),
    );
  });

  it('should not create task without title', () => {
    component.newTask = { title: '', priority: 'Medium' };
    component.createTask();
    expect(apiSpy.createTask).not.toHaveBeenCalled();
  });

  it('should return correct status class', () => {
    expect(component.getStatusClass('Active')).toContain('emerald');
    expect(component.getStatusClass('Cancelled')).toContain('rose');
  });
});
