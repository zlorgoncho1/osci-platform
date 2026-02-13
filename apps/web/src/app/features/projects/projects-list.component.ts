import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmService } from '../../shared/components/confirm/confirm.service';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-brand font-bold text-white">Security Projects</h1>
          <p class="text-xs text-zinc-500 mt-1">Manage and track security workstreams
            <a routerLink="/app/docs/module-projects"
               class="inline-flex items-center gap-1 ml-3 text-zinc-600 hover:text-emerald-400 transition-colors">
              <iconify-icon icon="solar:book-2-linear" width="12"></iconify-icon>
              <span class="text-[10px]">Guide</span>
            </a>
          </p>
        </div>
        <button *ngIf="perm.canGlobal('project', 'create')" (click)="showForm = !showForm"
          class="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold font-brand hover:bg-zinc-200 transition-colors flex items-center gap-2">
          <iconify-icon icon="solar:add-circle-linear" width="16"></iconify-icon>New Project
        </button>
      </div>

      <!-- Status filter chips -->
      <div class="flex items-center gap-2">
        <button *ngFor="let s of statusOptions" (click)="toggleFilter(s)"
          class="px-3 py-1 rounded-full text-[11px] font-medium border transition-colors"
          [ngClass]="activeFilter === s
            ? 'bg-white/10 border-white/20 text-white'
            : 'border-white/5 text-zinc-500 hover:border-white/10 hover:text-zinc-300'">
          {{ s }}
        </button>
      </div>

      <!-- Create form slide-out -->
      <div *ngIf="showForm" class="glass-panel p-6 space-y-4">
        <p class="text-xs uppercase tracking-wider text-zinc-500 mb-2">Create New Project</p>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Name</label>
            <input [(ngModel)]="newProject.name" type="text" placeholder="Project name"
              class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/20" />
          </div>
          <div>
            <label class="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Status</label>
            <select [(ngModel)]="newProject.status"
              class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-white/20">
              <option *ngFor="let s of statusOptions" [value]="s">{{ s }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Start Date</label>
            <input [(ngModel)]="newProject.startDate" type="date"
              class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-white/20" />
          </div>
          <div>
            <label class="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Target End Date</label>
            <input [(ngModel)]="newProject.targetEndDate" type="date"
              class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-white/20" />
          </div>
          <div class="col-span-2">
            <label class="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Description</label>
            <textarea [(ngModel)]="newProject.description" rows="2" placeholder="Project description..."
              class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/20"></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <button (click)="showForm = false"
            class="px-4 py-2 rounded-lg border border-white/10 text-xs text-zinc-400 font-brand hover:bg-white/5 transition-colors">Cancel</button>
          <button (click)="createProject()"
            class="px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold font-brand hover:bg-zinc-200 transition-colors">Create</button>
        </div>
      </div>

      <!-- Projects table -->
      <div class="glass-panel p-6">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/5">
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 pb-3 font-medium">Name</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 pb-3 font-medium">Status</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 pb-3 font-medium">Progress</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 pb-3 font-medium">Start</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 pb-3 font-medium">Target End</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 pb-3 font-medium">Tasks</th>
              <th class="text-right text-[10px] uppercase tracking-wider text-zinc-500 pb-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of filteredProjects" class="border-b border-white/5 table-row-hover cursor-pointer" [routerLink]="['/app/projects', p.id]">
              <td class="py-3 text-sm text-zinc-200">{{ p.name }}</td>
              <td class="py-3">
                <span class="px-2 py-0.5 rounded text-[10px] font-medium"
                  [ngClass]="getStatusClass(p.status)">{{ p.status }}</span>
              </td>
              <td class="py-3">
                <div class="flex items-center gap-2">
                  <div class="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div class="h-full rounded-full bg-emerald-500 transition-all"
                      [style.width.%]="p._progress || 0"></div>
                  </div>
                  <span class="text-[10px] font-mono text-zinc-500">{{ p._progress || 0 }}%</span>
                </div>
              </td>
              <td class="py-3 text-xs text-zinc-500 font-mono">{{ p.startDate | date:'yyyy-MM-dd' }}</td>
              <td class="py-3 text-xs text-zinc-500 font-mono">{{ p.targetEndDate | date:'yyyy-MM-dd' }}</td>
              <td class="py-3 text-xs text-zinc-400 font-mono">{{ p._taskCount || 0 }}</td>
              <td class="py-3 text-right" *ngIf="perm.canGlobal('project', 'delete')">
                <button (click)="deleteProject(p.id, $event)"
                  class="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <iconify-icon icon="solar:trash-bin-2-linear" width="14" class="text-zinc-600 hover:text-rose-500"></iconify-icon>
                </button>
              </td>
            </tr>
            <tr *ngIf="filteredProjects.length === 0">
              <td colspan="7" class="py-12 text-center text-xs text-zinc-600">No projects found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ProjectsListComponent implements OnInit {
  projects: any[] = [];
  filteredProjects: any[] = [];
  showForm = false;
  activeFilter = '';
  statusOptions = ['Planning', 'Active', 'OnHold', 'Completed', 'Cancelled'];

  newProject: any = {
    name: '',
    description: '',
    status: 'Planning',
    startDate: '',
    targetEndDate: '',
  };

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private confirmService: ConfirmService,
    public perm: PermissionService,
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    const params: any = {};
    if (this.activeFilter) params.status = this.activeFilter;

    this.api.getProjects(params).subscribe({
      next: (data) => {
        this.projects = data || [];
        this.filteredProjects = this.projects;
        // Load stats for each project
        for (const p of this.projects) {
          this.api.getProjectStats(p.id).subscribe({
            next: (stats) => {
              p._progress = stats.percentComplete || 0;
              p._taskCount = stats.total || 0;
            },
            error: () => {
              p._progress = 0;
              p._taskCount = 0;
            },
          });
        }
      },
      error: () => {
        this.projects = [];
        this.filteredProjects = [];
      },
    });
  }

  toggleFilter(status: string): void {
    this.activeFilter = this.activeFilter === status ? '' : status;
    this.loadProjects();
  }

  createProject(): void {
    const profile = this.authService.userProfile;
    const payload = {
      ...this.newProject,
      ownerId: profile?.['sub'] || 'unknown',
      startDate: this.newProject.startDate || undefined,
      targetEndDate: this.newProject.targetEndDate || undefined,
    };
    this.api.createProject(payload).subscribe({
      next: () => {
        this.showForm = false;
        this.newProject = { name: '', description: '', status: 'Planning', startDate: '', targetEndDate: '' };
        this.loadProjects();
      },
    });
  }

  async deleteProject(id: string, event: Event): Promise<void> {
    event.stopPropagation();
    const ok = await this.confirmService.confirm({
      title: 'Supprimer le projet',
      message: 'Supprimer ce projet, ses jalons et toutes les tâches associées ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    this.api.deleteProject(id).subscribe({
      next: () => this.loadProjects(),
    });
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
