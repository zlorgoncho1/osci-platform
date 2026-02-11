import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { RemediationKanbanComponent } from './remediation-kanban.component';
import { ApiService } from '../../core/services/api.service';

describe('RemediationKanbanComponent', () => {
  let component: RemediationKanbanComponent;
  let fixture: ComponentFixture<RemediationKanbanComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;

  const mockTasks = [
    { id: 't1', title: 'T1', status: 'ToDo', priority: 'High', project: { name: 'ProjA' } },
    { id: 't2', title: 'T2', status: 'InProgress', priority: 'Medium', project: null },
    { id: 't3', title: 'T3', status: 'Done', priority: 'Low', project: { name: 'ProjB' } },
  ];

  const mockProjects = [
    { id: 'p1', name: 'ProjA' },
    { id: 'p2', name: 'ProjB' },
  ];

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', ['getTasks', 'getProjects', 'updateTask']);
    apiSpy.getTasks.and.returnValue(of(mockTasks));
    apiSpy.getProjects.and.returnValue(of(mockProjects));
    apiSpy.updateTask.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [RemediationKanbanComponent, HttpClientTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [{ provide: ApiService, useValue: apiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(RemediationKanbanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load projects on init', () => {
    expect(apiSpy.getProjects).toHaveBeenCalled();
    expect(component.projects.length).toBe(2);
  });

  it('should load tasks and distribute into columns', () => {
    expect(component.totalTasks).toBe(3);
    // Check tasks distributed by status
    const todoCol = component.columns.find(c => c.id === 'todo');
    expect(todoCol).toBeDefined();
  });

  it('should filter tasks by project', () => {
    component.selectedProjectId = 'p1';
    component.onProjectFilterChange();
    expect(apiSpy.getTasks).toHaveBeenCalledWith({ projectId: 'p1' });
  });

  it('should clear project filter', () => {
    component.selectedProjectId = '';
    component.onProjectFilterChange();
    expect(apiSpy.getTasks).toHaveBeenCalledWith({});
  });

  it('should refresh tasks', () => {
    const callCount = apiSpy.getTasks.calls.count();
    component.refreshTasks();
    expect(apiSpy.getTasks.calls.count()).toBe(callCount + 1);
  });

  it('should detect overdue dates', () => {
    expect(component.isOverdue('2020-01-01')).toBeTrue();
    expect(component.isOverdue('2099-12-31')).toBeFalse();
  });

  it('should get connected lists excluding current', () => {
    const connected = component.getConnectedLists('todo');
    expect(connected).not.toContain('todo');
    expect(connected.length).toBe(3);
  });

  it('should handle API errors gracefully', () => {
    apiSpy.getProjects.and.returnValue(throwError(() => new Error('fail')));
    component.loadProjects();
    expect(component.projects).toEqual([]);
  });
});
