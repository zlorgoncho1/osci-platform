import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ProjectsListComponent } from './projects-list.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

describe('ProjectsListComponent', () => {
  let component: ProjectsListComponent;
  let fixture: ComponentFixture<ProjectsListComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', [
      'getProjects', 'getProjectStats', 'createProject', 'deleteProject',
    ]);
    authSpy = jasmine.createSpyObj('AuthService', [], {
      userProfile: { sub: 'test-user' },
      userRoles: ['admin'],
    });

    apiSpy.getProjects.and.returnValue(of([
      { id: '1', name: 'Project A', status: 'Active', startDate: '2026-01-01', targetEndDate: '2026-06-30' },
      { id: '2', name: 'Project B', status: 'Planning', startDate: null, targetEndDate: null },
    ]));
    apiSpy.getProjectStats.and.returnValue(of({ percentComplete: 60, total: 5 }));
    apiSpy.createProject.and.returnValue(of({ id: '3', name: 'New' }));
    apiSpy.deleteProject.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [
        ProjectsListComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load projects on init', () => {
    expect(apiSpy.getProjects).toHaveBeenCalled();
    expect(component.projects.length).toBe(2);
    expect(component.filteredProjects.length).toBe(2);
  });

  it('should load stats for each project', () => {
    expect(apiSpy.getProjectStats).toHaveBeenCalledTimes(2);
  });

  it('should filter by status toggle', () => {
    component.toggleFilter('Active');
    expect(component.activeFilter).toBe('Active');
    expect(apiSpy.getProjects).toHaveBeenCalledWith({ status: 'Active' });
  });

  it('should clear filter on double toggle', () => {
    component.toggleFilter('Active');
    component.toggleFilter('Active');
    expect(component.activeFilter).toBe('');
    expect(apiSpy.getProjects).toHaveBeenCalledWith({});
  });

  it('should show/hide create form', () => {
    expect(component.showForm).toBeFalse();
    component.showForm = true;
    expect(component.showForm).toBeTrue();
  });

  it('should call createProject', () => {
    component.newProject = { name: 'Test', description: '', status: 'Planning', startDate: '', targetEndDate: '' };
    component.createProject();
    expect(apiSpy.createProject).toHaveBeenCalledWith(
      jasmine.objectContaining({ name: 'Test', ownerId: 'test-user' }),
    );
  });

  it('should get correct status class', () => {
    expect(component.getStatusClass('Active')).toContain('emerald');
    expect(component.getStatusClass('Planning')).toContain('blue');
    expect(component.getStatusClass('OnHold')).toContain('amber');
    expect(component.getStatusClass('Completed')).toContain('zinc');
    expect(component.getStatusClass('Cancelled')).toContain('rose');
  });

  it('should handle API error gracefully', () => {
    apiSpy.getProjects.and.returnValue(throwError(() => new Error('fail')));
    component.loadProjects();
    expect(component.projects).toEqual([]);
    expect(component.filteredProjects).toEqual([]);
  });
});
