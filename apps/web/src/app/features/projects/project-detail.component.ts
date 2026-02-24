import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ConfirmService } from '../../shared/components/confirm/confirm.service';
import { PermissionService } from '../../core/services/permission.service';
import { UserPickerComponent } from '../../shared/components/user-picker/user-picker.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, UserPickerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="space-y-6" *ngIf="project">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-xs text-zinc-500">
        <a routerLink="/app/projects" class="hover:text-zinc-300 transition-colors">Projects</a>
        <iconify-icon icon="solar:alt-arrow-right-linear" width="12"></iconify-icon>
        <span class="text-zinc-300">{{ project.name }}</span>
      </div>

      <!-- Header -->
      <div class="glass-panel p-6">
        <div class="flex items-start justify-between">
          <div class="space-y-2 flex-1 min-w-0">
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-brand font-bold text-white" *ngIf="!editing">{{ project.name }}</h1>
              <input *ngIf="editing" [(ngModel)]="editData.name" type="text"
                class="text-2xl font-brand font-bold text-white bg-transparent border-b border-white/20 focus:outline-none" />
              <span class="px-2 py-0.5 rounded text-[10px] font-medium" [ngClass]="getStatusClass(project.status)">{{ project.status }}</span>
            </div>
            <p class="text-sm text-zinc-400" *ngIf="!editing">{{ project.description || 'No description' }}
              <a routerLink="/app/docs/module-projects"
                 class="inline-flex items-center gap-1 ml-3 text-zinc-600 hover:text-emerald-400 transition-colors">
                <iconify-icon icon="solar:book-2-linear" width="12"></iconify-icon>
                <span class="text-[10px]">Guide</span>
              </a>
            </p>
            <textarea *ngIf="editing" [(ngModel)]="editData.description" rows="2"
              class="w-full text-sm text-zinc-400 bg-transparent border border-white/10 rounded px-2 py-1 focus:outline-none"></textarea>

            <!-- Edit: Owner picker -->
            <div *ngIf="editing" class="max-w-xs">
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Owner (Lead)</label>
              <app-user-picker [value]="editData.ownerId" (valueChange)="editData.ownerId = $event" placeholder="Select owner..."></app-user-picker>
            </div>

            <div class="flex items-center gap-4 text-xs text-zinc-500">
              <span class="flex items-center gap-1">
                <iconify-icon icon="solar:calendar-linear" width="12"></iconify-icon>
                Start: {{ project.startDate | date:'yyyy-MM-dd' : '' : 'en' }}
              </span>
              <span class="flex items-center gap-1">
                <iconify-icon icon="solar:flag-linear" width="12"></iconify-icon>
                Target: {{ project.targetEndDate | date:'yyyy-MM-dd' : '' : 'en' }}
              </span>
              <span class="flex items-center gap-1">
                <iconify-icon icon="solar:user-linear" width="12"></iconify-icon>
                Owner: {{ formatUser(project.owner) }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <div *ngIf="editing" class="flex gap-2">
              <select [(ngModel)]="editData.status"
                class="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none">
                <option *ngFor="let s of statusOptions" [value]="s">{{ s }}</option>
              </select>
              <button (click)="saveProject()"
                class="px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold font-brand hover:bg-zinc-200 transition-colors">Save</button>
              <button (click)="editing = false"
                class="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 font-brand hover:bg-white/5 transition-colors">Cancel</button>
            </div>
            <button *ngIf="!editing && perm.canGlobal('project', 'update')" (click)="startEdit()"
              class="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 font-brand hover:bg-white/5 transition-colors flex items-center gap-1">
              <iconify-icon icon="solar:pen-linear" width="12"></iconify-icon>Edit
            </button>
            <button *ngIf="!editing && perm.canGlobal('project', 'delete')" (click)="deleteProject()"
              class="px-3 py-1.5 rounded-lg border border-rose-500/20 text-xs text-rose-500 font-brand hover:bg-rose-500/10 transition-colors flex items-center gap-1">
              <iconify-icon icon="solar:trash-bin-2-linear" width="12"></iconify-icon>Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Progress + Milestones row -->
      <div class="grid grid-cols-12 gap-6">
        <div class="col-span-12 lg:col-span-4 glass-panel p-6">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-4">Progress</p>
          <div class="flex items-center justify-center mb-4">
            <div class="relative w-24 h-24">
              <svg class="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="8"/>
                <circle cx="60" cy="60" r="54" fill="none" stroke="#10B981" stroke-width="8" stroke-linecap="round"
                  [attr.stroke-dasharray]="339.292"
                  [attr.stroke-dashoffset]="339.292 * (1 - (stats?.percentComplete || 0) / 100)"/>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-xl font-brand font-bold text-emerald-500">{{ stats?.percentComplete || 0 }}%</span>
              </div>
            </div>
          </div>
          <div class="space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-zinc-500">Total tasks</span>
              <span class="text-zinc-300 font-mono">{{ stats?.total || 0 }}</span>
            </div>
            <div *ngFor="let entry of statusEntries" class="flex justify-between text-xs">
              <span class="text-zinc-500">{{ entry[0] }}</span>
              <span class="text-zinc-300 font-mono">{{ entry[1] }}</span>
            </div>
          </div>
        </div>

        <!-- Milestones -->
        <div class="col-span-12 lg:col-span-8 glass-panel p-6">
          <div class="flex items-center justify-between mb-4">
            <p class="text-[10px] uppercase tracking-wider text-zinc-500">Milestones</p>
            <button *ngIf="perm.canGlobal('project', 'update')" (click)="showMilestoneForm = !showMilestoneForm"
              class="px-2 py-1 rounded-lg border border-white/10 text-[10px] text-zinc-400 font-brand hover:bg-white/5 transition-colors flex items-center gap-1">
              <iconify-icon icon="solar:add-circle-linear" width="12"></iconify-icon>Add
            </button>
          </div>

          <!-- Add milestone form -->
          <div *ngIf="showMilestoneForm" class="mb-4 p-3 rounded-lg border border-white/10 bg-white/[0.02] space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <input [(ngModel)]="newMilestone.title" type="text" placeholder="Milestone title"
                class="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none" />
              <input [(ngModel)]="newMilestone.dueDate" type="date"
                class="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none" />
            </div>
            <div class="flex justify-end gap-2">
              <button (click)="showMilestoneForm = false" class="px-3 py-1 rounded text-[10px] text-zinc-500 font-brand hover:text-zinc-300">Cancel</button>
              <button (click)="createMilestone()" class="px-3 py-1 rounded bg-white text-black text-[10px] font-semibold font-brand hover:bg-zinc-200">Add</button>
            </div>
          </div>

          <!-- Milestones list -->
          <div class="space-y-2">
            <div *ngFor="let m of milestones; let i = index"
              class="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
              <div class="flex items-center gap-3">
                <button (click)="toggleMilestoneStatus(m)" [disabled]="!perm.canGlobal('project', 'update')"
                  class="w-5 h-5 rounded border flex items-center justify-center transition-colors"
                  [ngClass]="m.status === 'Completed' ? 'bg-emerald-500/20 border-emerald-500/30' : 'border-white/10 hover:border-white/20'">
                  <iconify-icon *ngIf="m.status === 'Completed'" icon="solar:check-read-linear" width="12" class="text-emerald-500"></iconify-icon>
                </button>
                <div>
                  <p class="text-sm text-zinc-200" [ngClass]="m.status === 'Completed' ? 'line-through text-zinc-500' : ''">{{ m.title }}</p>
                  <p *ngIf="m.dueDate" class="text-[10px] font-mono text-zinc-600">Due: {{ m.dueDate | date:'yyyy-MM-dd' }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-1.5 py-0.5 rounded text-[9px]"
                  [ngClass]="{
                    'bg-zinc-500/10 text-zinc-400': m.status === 'Pending',
                    'bg-blue-500/10 text-blue-500': m.status === 'InProgress',
                    'bg-emerald-500/10 text-emerald-500': m.status === 'Completed'
                  }">{{ m.status }}</span>
                <button *ngIf="perm.canGlobal('project', 'update')" (click)="deleteMilestone(m.id)"
                  class="p-1 rounded hover:bg-white/5 transition-colors">
                  <iconify-icon icon="solar:trash-bin-2-linear" width="12" class="text-zinc-600 hover:text-rose-500"></iconify-icon>
                </button>
              </div>
            </div>
            <div *ngIf="milestones.length === 0" class="py-6 text-center text-[10px] text-zinc-600">
              No milestones yet
            </div>
          </div>
        </div>
      </div>

      <!-- Concerned section -->
      <div class="glass-panel p-6">
        <div class="flex items-center justify-between mb-4">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500">Concerned People</p>
          <button *ngIf="perm.canGlobal('project', 'update')" (click)="showConcernedPicker = !showConcernedPicker"
            class="px-2 py-1 rounded-lg border border-white/10 text-[10px] text-zinc-400 font-brand hover:bg-white/5 transition-colors flex items-center gap-1">
            <iconify-icon icon="solar:add-circle-linear" width="12"></iconify-icon>Add
          </button>
        </div>

        <!-- Add concerned picker -->
        <div *ngIf="showConcernedPicker" class="mb-4 p-3 rounded-lg border border-white/10 bg-white/[0.02] space-y-3">
          <div class="max-w-xs">
            <app-user-picker [value]="newConcernedUserId" (valueChange)="newConcernedUserId = $event" placeholder="Select a person..."></app-user-picker>
          </div>
          <div class="flex justify-end gap-2">
            <button (click)="showConcernedPicker = false; newConcernedUserId = null" class="px-3 py-1 rounded text-[10px] text-zinc-500 font-brand hover:text-zinc-300">Cancel</button>
            <button (click)="addConcerned()" [disabled]="!newConcernedUserId"
              class="px-3 py-1 rounded bg-white text-black text-[10px] font-semibold font-brand hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed">Add</button>
          </div>
        </div>

        <!-- Concerned list -->
        <div class="space-y-2">
          <div *ngFor="let c of project.concerned || []"
            class="flex items-center justify-between p-2 rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                <iconify-icon icon="solar:user-linear" width="12" class="text-zinc-500"></iconify-icon>
              </div>
              <div>
                <p class="text-xs text-zinc-200">{{ c.firstName || '' }} {{ c.lastName || '' }}</p>
                <p class="text-[10px] text-zinc-600">{{ c.email }}</p>
              </div>
            </div>
            <button *ngIf="perm.canGlobal('project', 'update')" (click)="removeConcerned(c.id)"
              class="p-1 rounded hover:bg-white/5 transition-colors">
              <iconify-icon icon="solar:close-circle-linear" width="14" class="text-zinc-600 hover:text-rose-500"></iconify-icon>
            </button>
          </div>
          <div *ngIf="!project.concerned || project.concerned.length === 0" class="py-4 text-center text-[10px] text-zinc-600">
            No concerned people yet
          </div>
        </div>
      </div>

      <!-- Tasks section -->
      <div class="glass-panel p-6">
        <div class="flex items-center justify-between mb-4">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500">Project Tasks</p>
          <button *ngIf="perm.canGlobal('task', 'create')" (click)="showTaskForm = !showTaskForm"
            class="px-2 py-1 rounded-lg border border-white/10 text-[10px] text-zinc-400 font-brand hover:bg-white/5 transition-colors flex items-center gap-1">
            <iconify-icon icon="solar:add-circle-linear" width="12"></iconify-icon>Add Task
          </button>
        </div>

        <!-- Add task form -->
        <div *ngIf="showTaskForm" class="mb-4 p-3 rounded-lg border border-white/10 bg-white/[0.02] space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input [(ngModel)]="newTask.title" type="text" placeholder="Task title"
              class="sm:col-span-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none" />
            <select [(ngModel)]="newTask.priority"
              class="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="text-[10px] text-zinc-600 mb-0.5 block">Assignee</label>
              <app-user-picker [value]="newTask.assignedToId" (valueChange)="newTask.assignedToId = $event" placeholder="Select assignee..."></app-user-picker>
            </div>
            <div>
              <label class="text-[10px] text-zinc-600 mb-0.5 block">Lead</label>
              <app-user-picker [value]="newTask.leadId" (valueChange)="newTask.leadId = $event" placeholder="Select lead..."></app-user-picker>
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <button (click)="showTaskForm = false" class="px-3 py-1 rounded text-[10px] text-zinc-500 font-brand hover:text-zinc-300">Cancel</button>
            <button (click)="createTask()" class="px-3 py-1 rounded bg-white text-black text-[10px] font-semibold font-brand hover:bg-zinc-200">Add</button>
          </div>
        </div>

        <!-- Tasks table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-white/5">
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 pb-2 font-medium pl-4">Title</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 pb-2 font-medium">Status</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 pb-2 font-medium">Priority</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 pb-2 font-medium">Assignee</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 pb-2 font-medium">Lead</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 pb-2 font-medium">Due</th>
                <th class="text-right text-[10px] uppercase tracking-wider text-zinc-500 pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let task of tasks">
                <tr class="border-b border-white/5 table-row-hover">
                  <td class="py-2.5 text-sm text-zinc-200 pl-4">
                    {{ task.title }}
                  </td>
                  <td class="py-2.5">
                    <span class="px-1.5 py-0.5 rounded text-[9px]"
                      [ngClass]="{
                        'bg-zinc-500/10 text-zinc-400': task.status === 'ToDo',
                        'bg-blue-500/10 text-blue-500': task.status === 'InProgress',
                        'bg-amber-500/10 text-amber-500': task.status === 'Review',
                        'bg-emerald-500/10 text-emerald-500': task.status === 'Done'
                      }">{{ task.status }}</span>
                  </td>
                  <td class="py-2.5">
                    <span class="px-1.5 py-0.5 rounded text-[9px]"
                      [ngClass]="{
                        'bg-rose-500/10 text-rose-500': task.priority === 'Critical',
                        'bg-amber-500/10 text-amber-500': task.priority === 'High',
                        'bg-blue-500/10 text-blue-500': task.priority === 'Medium',
                        'bg-zinc-500/10 text-zinc-400': task.priority === 'Low'
                      }">{{ task.priority }}</span>
                  </td>
                  <td class="py-2.5 text-xs text-zinc-500">{{ formatUser(task.assignedTo) }}</td>
                  <td class="py-2.5 text-xs text-zinc-500">{{ formatUser(task.lead) }}</td>
                  <td class="py-2.5 text-xs text-zinc-500 font-mono">{{ task.slaDue | date:'MM/dd' }}</td>
                  <td class="py-2.5 text-right">
                    <button *ngIf="perm.canGlobal('task', 'delete')" (click)="deleteTask(task.id)"
                      class="p-1 rounded hover:bg-white/5 transition-colors">
                      <iconify-icon icon="solar:trash-bin-2-linear" width="12" class="text-zinc-600 hover:text-rose-500"></iconify-icon>
                    </button>
                  </td>
                </tr>
                <!-- Sub-tasks -->
                <tr *ngFor="let child of task.children || []" class="border-b border-white/5 bg-white/[0.01]">
                  <td class="py-2 text-sm text-zinc-400 pl-10">
                    <span class="text-zinc-600 mr-1">&lfloor;</span>{{ child.title }}
                  </td>
                  <td class="py-2">
                    <span class="px-1.5 py-0.5 rounded text-[9px]"
                      [ngClass]="{
                        'bg-zinc-500/10 text-zinc-400': child.status === 'ToDo',
                        'bg-blue-500/10 text-blue-500': child.status === 'InProgress',
                        'bg-amber-500/10 text-amber-500': child.status === 'Review',
                        'bg-emerald-500/10 text-emerald-500': child.status === 'Done'
                      }">{{ child.status }}</span>
                  </td>
                  <td class="py-2">
                    <span class="px-1.5 py-0.5 rounded text-[9px]"
                      [ngClass]="{
                        'bg-rose-500/10 text-rose-500': child.priority === 'Critical',
                        'bg-amber-500/10 text-amber-500': child.priority === 'High',
                        'bg-blue-500/10 text-blue-500': child.priority === 'Medium',
                        'bg-zinc-500/10 text-zinc-400': child.priority === 'Low'
                      }">{{ child.priority }}</span>
                  </td>
                  <td class="py-2 text-xs text-zinc-500">{{ formatUser(child.assignedTo) }}</td>
                  <td class="py-2 text-xs text-zinc-500">{{ formatUser(child.lead) }}</td>
                  <td class="py-2 text-xs text-zinc-500 font-mono">{{ child.slaDue | date:'MM/dd' }}</td>
                  <td class="py-2 text-right">
                    <button *ngIf="perm.canGlobal('task', 'delete')" (click)="deleteTask(child.id)"
                      class="p-1 rounded hover:bg-white/5 transition-colors">
                      <iconify-icon icon="solar:trash-bin-2-linear" width="10" class="text-zinc-600 hover:text-rose-500"></iconify-icon>
                    </button>
                  </td>
                </tr>
              </ng-container>
              <tr *ngIf="tasks.length === 0">
                <td colspan="7" class="py-8 text-center text-xs text-zinc-600">No tasks in this project</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class ProjectDetailComponent implements OnInit {
  projectId = '';
  project: any = null;
  milestones: any[] = [];
  tasks: any[] = [];
  stats: any = null;
  statusEntries: [string, number][] = [];
  editing = false;
  editData: any = {};
  statusOptions = ['Planning', 'Active', 'OnHold', 'Completed', 'Cancelled'];

  showMilestoneForm = false;
  newMilestone: any = { title: '', dueDate: '' };

  showTaskForm = false;
  newTask: any = { title: '', priority: 'Medium', assignedToId: null, leadId: null };

  showConcernedPicker = false;
  newConcernedUserId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private confirmService: ConfirmService,
    public perm: PermissionService,
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    this.loadProject();
    this.loadTasks();
    this.loadStats();
  }

  loadProject(): void {
    this.api.getProject(this.projectId).subscribe({
      next: (data) => {
        this.project = data;
        this.milestones = (data.milestones || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      },
    });
  }

  loadTasks(): void {
    this.api.getProjectTasks(this.projectId).subscribe({
      next: (data) => {
        const all = data || [];
        this.tasks = all.filter((t: any) => !t.parentTaskId);
      },
    });
  }

  loadStats(): void {
    this.api.getProjectStats(this.projectId).subscribe({
      next: (data) => {
        this.stats = data;
        this.statusEntries = Object.entries(data.byStatus || {}) as [string, number][];
      },
    });
  }

  startEdit(): void {
    this.editData = {
      name: this.project.name,
      description: this.project.description || '',
      status: this.project.status,
      ownerId: this.project.ownerId,
    };
    this.editing = true;
  }

  saveProject(): void {
    this.api.updateProject(this.projectId, this.editData).subscribe({
      next: () => {
        this.editing = false;
        this.loadProject();
      },
    });
  }

  // --- Concerned ---

  addConcerned(): void {
    if (!this.newConcernedUserId) return;
    this.api.addProjectConcerned(this.projectId, this.newConcernedUserId).subscribe({
      next: () => {
        this.showConcernedPicker = false;
        this.newConcernedUserId = null;
        this.loadProject();
      },
    });
  }

  removeConcerned(userId: string): void {
    this.api.removeProjectConcerned(this.projectId, userId).subscribe({
      next: () => this.loadProject(),
    });
  }

  // --- Milestones ---

  createMilestone(): void {
    if (!this.newMilestone.title) return;
    const payload: any = {
      title: this.newMilestone.title,
      order: this.milestones.length,
    };
    if (this.newMilestone.dueDate) payload.dueDate = this.newMilestone.dueDate;

    this.api.createMilestone(this.projectId, payload).subscribe({
      next: () => {
        this.showMilestoneForm = false;
        this.newMilestone = { title: '', dueDate: '' };
        this.loadProject();
      },
    });
  }

  toggleMilestoneStatus(m: any): void {
    const nextStatus = m.status === 'Completed' ? 'Pending' : m.status === 'Pending' ? 'InProgress' : 'Completed';
    this.api.updateMilestone(this.projectId, m.id, { status: nextStatus }).subscribe({
      next: () => this.loadProject(),
    });
  }

  deleteMilestone(milestoneId: string): void {
    this.api.deleteMilestone(this.projectId, milestoneId).subscribe({
      next: () => this.loadProject(),
    });
  }

  // --- Tasks ---

  createTask(): void {
    if (!this.newTask.title) return;
    const payload: any = {
      title: this.newTask.title,
      priority: this.newTask.priority,
      projectId: this.projectId,
    };
    if (this.project?.objectId) {
      payload.objectId = this.project.objectId;
    }
    if (this.newTask.assignedToId) payload.assignedToId = this.newTask.assignedToId;
    if (this.newTask.leadId) payload.leadId = this.newTask.leadId;

    this.api.createTask(payload).subscribe({
      next: () => {
        this.showTaskForm = false;
        this.newTask = { title: '', priority: 'Medium', assignedToId: null, leadId: null };
        this.loadTasks();
        this.loadStats();
      },
    });
  }

  async deleteProject(): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: 'Supprimer le projet',
      message: 'Supprimer ce projet, ses jalons et toutes les tâches associées ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    this.api.deleteProject(this.projectId).subscribe({
      next: () => { this.router.navigate(['/app/projects']); },
      error: (err) => console.error('[OSCI] Failed to delete project:', err),
    });
  }

  async deleteTask(taskId: string): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: 'Supprimer la tâche',
      message: 'Supprimer cette tâche ?',
      confirmText: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    this.api.deleteTask(taskId).subscribe({
      next: () => {
        this.loadTasks();
        this.loadStats();
      },
      error: (err) => console.error('[OSCI] Failed to delete task:', err),
    });
  }

  // --- Helpers ---

  formatUser(user: any): string {
    if (!user) return 'Unassigned';
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
    return name || user.email || 'Unknown';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'Planning': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      case 'OnHold': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'Completed': return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
      case 'Cancelled': return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
    }
  }
}
