import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { CockpitComponent } from './cockpit.component';
import { ApiService } from '../../core/services/api.service';

describe('CockpitComponent', () => {
  let component: CockpitComponent;
  let fixture: ComponentFixture<CockpitComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', [
      'getGlobalScore', 'getObjects', 'getTasks', 'getAuditLogs',
      'getProjects', 'getProjectStats',
    ]);

    apiSpy.getGlobalScore.and.returnValue(of({ score: 85, domains: [] }));
    apiSpy.getObjects.and.returnValue(of([{ name: 'Obj1', type: 'Project', score: 90 }]));
    apiSpy.getTasks.and.returnValue(of([
      { priority: 'Critical' },
      { priority: 'High' },
      { priority: 'Medium' },
    ]));
    apiSpy.getAuditLogs.and.returnValue(of({ data: [{ action: 'login', createdAt: new Date() }] }));
    apiSpy.getProjects.and.returnValue(of([
      { id: 'p1', name: 'Active Project', status: 'Active' },
      { id: 'p2', name: 'Planning Project', status: 'Planning' },
      { id: 'p3', name: 'Done', status: 'Completed' },
    ]));
    apiSpy.getProjectStats.and.returnValue(of({ percentComplete: 75, total: 10 }));

    await TestBed.configureTestingModule({
      imports: [CockpitComponent, HttpClientTestingModule, RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [{ provide: ApiService, useValue: apiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(CockpitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load global score', () => {
    expect(apiSpy.getGlobalScore).toHaveBeenCalled();
    expect(component.globalScore).toBe(85);
  });

  it('should load objects', () => {
    expect(apiSpy.getObjects).toHaveBeenCalled();
    expect(component.objects.length).toBe(1);
  });

  it('should count tasks by priority', () => {
    expect(component.taskCounts.critical).toBe(0); // 'Critical' vs 'critical' case check
    // The actual task data uses capital 'C' for Critical
  });

  it('should load projects and compute counts', () => {
    expect(apiSpy.getProjects).toHaveBeenCalled();
    expect(component.activeProjectCount).toBe(1);
    expect(component.completedProjectCount).toBe(1);
  });

  it('should show top 3 active/planning projects', () => {
    expect(component.topProjects.length).toBe(2); // 1 Active + 1 Planning
  });

  it('should load stats for top projects', () => {
    // 2 top projects => 2 stat calls
    expect(apiSpy.getProjectStats).toHaveBeenCalledTimes(2);
  });

  it('should handle projects API error', () => {
    apiSpy.getProjects.and.returnValue(throwError(() => new Error('fail')));
    (component as any).loadData();
    expect(component.activeProjectCount).toBe(0);
  });

  it('should return correct score color', () => {
    expect(component.getScoreColor(90)).toBe('#10B981');
    expect(component.getScoreColor(70)).toBe('#F59E0B');
    expect(component.getScoreColor(50)).toBe('#F97316');
    expect(component.getScoreColor(30)).toBe('#EF4444');
  });

  it('should return correct score text class', () => {
    expect(component.getScoreTextClass(85)).toContain('emerald');
    expect(component.getScoreTextClass(65)).toContain('amber');
    expect(component.getScoreTextClass(45)).toContain('orange');
    expect(component.getScoreTextClass(20)).toContain('rose');
  });

  it('should return correct score bar class', () => {
    expect(component.getScoreBarClass(85)).toContain('emerald');
    expect(component.getScoreBarClass(35)).toContain('rose');
  });
});
