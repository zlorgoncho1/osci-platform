import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  CdkDrag,
  CdkDropList,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { ApiService } from '../../core/services/api.service';
import { ConfirmService } from '../../shared/components/confirm/confirm.service';
import { PermissionService } from '../../core/services/permission.service';
import { UserPickerComponent } from '../../shared/components/user-picker/user-picker.component';

interface KanbanColumn {
  id: string;
  title: string;
  tasks: any[];
}

interface IncidentColumn {
  id: string;
  title: string;
  incidents: any[];
}

@Component({
  selector: 'app-remediation-kanban',
  standalone: true,
  imports: [CommonModule, RouterLink, CdkDrag, CdkDropList, FormsModule, UserPickerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-brand font-bold text-white">Remediation Board</h1>
          <p class="text-xs text-zinc-500 mt-1">{{ activeTab === 'tasks' ? 'Drag tasks between columns to update status' : 'Drag incidents between columns to update status' }}
            <a routerLink="/app/docs/module-remediation"
               class="inline-flex items-center gap-1 ml-3 text-zinc-600 hover:text-emerald-400 transition-colors">
              <iconify-icon icon="solar:book-2-linear" width="12"></iconify-icon>
              <span class="text-[10px]">Guide</span>
            </a>
          </p>
        </div>
        <div class="flex items-center gap-3 flex-wrap" *ngIf="activeTab === 'tasks'">
          <button (click)="toggleMyTasks()"
            class="px-3 py-1.5 rounded-lg text-xs font-brand transition-colors flex items-center gap-1"
            [ngClass]="showMyTasks
              ? 'bg-white/10 border border-white/20 text-white'
              : 'border border-white/10 text-zinc-400 hover:bg-white/5'">
            <iconify-icon icon="solar:user-linear" width="12"></iconify-icon>
            My Tasks
          </button>
          <select [(ngModel)]="selectedProjectId" (ngModelChange)="onFilterChange()"
            class="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-white/20">
            <option value="">All Projects</option>
            <option *ngFor="let p of projects" [value]="p.id">{{ p.name }}</option>
          </select>
          <select [(ngModel)]="selectedObjectId" (ngModelChange)="onFilterChange()"
            class="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-white/20">
            <option value="">All Objects</option>
            <option *ngFor="let o of objects" [value]="o.id">{{ o.name }}</option>
          </select>
          <select [(ngModel)]="selectedChecklistId" (ngModelChange)="onFilterChange()"
            class="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-white/20">
            <option value="">All Checklists</option>
            <option *ngFor="let c of checklists" [value]="c.id">{{ c.title }}</option>
          </select>
          <select [(ngModel)]="selectedObjectGroupId" (ngModelChange)="onFilterChange()"
            class="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-white/20">
            <option value="">All Groups</option>
            <option *ngFor="let g of objectGroups" [value]="g.id">{{ g.name }}</option>
          </select>
          <span class="text-[10px] font-mono text-zinc-600">{{ totalTasks }} tasks</span>
          <button *ngIf="perm.canGlobal('task', 'create')" (click)="showCreateForm = true"
            class="px-3 py-1.5 rounded-lg bg-white text-black text-xs font-brand font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2">
            <iconify-icon icon="solar:add-circle-linear" width="14"></iconify-icon>New Task
          </button>
          <button (click)="refreshTasks()"
            class="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 font-brand hover:bg-white/5 transition-colors flex items-center gap-2">
            <iconify-icon icon="solar:refresh-linear" width="14"></iconify-icon>Refresh
          </button>
        </div>
        <div class="flex items-center gap-3" *ngIf="activeTab === 'incidents'">
          <select [(ngModel)]="selectedObjectId" (ngModelChange)="loadIncidents()"
            class="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-white/20">
            <option value="">All Objects</option>
            <option *ngFor="let o of objects" [value]="o.id">{{ o.name }}</option>
          </select>
          <select [(ngModel)]="selectedObjectGroupId" (ngModelChange)="loadIncidents()"
            class="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-white/20">
            <option value="">All Groups</option>
            <option *ngFor="let g of objectGroups" [value]="g.id">{{ g.name }}</option>
          </select>
          <span class="text-[10px] font-mono text-zinc-600">{{ totalIncidents }} incidents</span>
          <button (click)="refreshIncidents()"
            class="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 font-brand hover:bg-white/5 transition-colors flex items-center gap-2">
            <iconify-icon icon="solar:refresh-linear" width="14"></iconify-icon>Refresh
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 border-b border-white/10">
        <button (click)="setActiveTab('tasks')"
          class="px-4 py-2 text-xs font-brand transition-colors"
          [ngClass]="activeTab === 'tasks' ? 'text-white border-b-2 border-white -mb-px' : 'text-zinc-500 hover:text-zinc-300'">
          Remediation
        </button>
        <button (click)="setActiveTab('incidents')"
          class="px-4 py-2 text-xs font-brand transition-colors"
          [ngClass]="activeTab === 'incidents' ? 'text-white border-b-2 border-white -mb-px' : 'text-zinc-500 hover:text-zinc-300'">
          Incidents
        </button>
      </div>

      <!-- Kanban Board (Tasks) -->
      <div *ngIf="activeTab === 'tasks'" class="flex gap-4 overflow-x-auto pb-4">
        <div *ngFor="let col of columns" class="flex-shrink-0 w-80">
          <!-- Column header -->
          <div class="flex items-center justify-between mb-3 px-1">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full"
                [ngClass]="{
                  'bg-zinc-500': col.id === 'ToDo',
                  'bg-blue-500': col.id === 'InProgress',
                  'bg-amber-500': col.id === 'Review',
                  'bg-emerald-500': col.id === 'Done'
                }"></span>
              <span class="text-xs font-medium text-zinc-400">{{ col.title }}</span>
            </div>
            <span class="text-[10px] text-zinc-600 font-mono bg-zinc-800/50 px-2 py-0.5 rounded">{{ col.tasks.length }}</span>
          </div>

          <!-- Drop zone -->
          <div
            cdkDropList
            [cdkDropListData]="col.tasks"
            [cdkDropListConnectedTo]="getConnectedLists(col.id)"
            [id]="col.id"
            (cdkDropListDropped)="onDrop($event, col)"
            class="min-h-[400px] space-y-3 p-2 rounded-xl border border-white/5 bg-white/[0.01]"
          >
            <!-- Task card -->
            <div *ngFor="let task of col.tasks" cdkDrag [cdkDragDisabled]="!perm.canGlobal('task', 'update')"
              (click)="openTaskDetail(task)"
              class="glass-panel p-4 cursor-grab active:cursor-grabbing">
              <!-- Priority bar -->
              <div class="h-0.5 rounded-full mb-3 -mt-1"
                [ngClass]="{
                  'bg-rose-500': task.priority === 'Critical',
                  'bg-amber-500': task.priority === 'High',
                  'bg-blue-500': task.priority === 'Medium',
                  'bg-zinc-600': task.priority === 'Low'
                }"></div>

              <p class="text-sm text-zinc-200 mb-2">{{ task.title }}</p>

              <div class="flex items-center gap-2 flex-wrap mb-3">
                <span class="px-1.5 py-0.5 rounded text-[9px]"
                  [ngClass]="{
                    'bg-rose-500/10 text-rose-500': task.priority === 'Critical',
                    'bg-amber-500/10 text-amber-500': task.priority === 'High',
                    'bg-blue-500/10 text-blue-500': task.priority === 'Medium',
                    'bg-zinc-500/10 text-zinc-400': task.priority === 'Low'
                  }">{{ task.priority }}</span>
                <span *ngIf="task.object?.name" class="px-1.5 py-0.5 rounded text-[9px] border border-white/10 text-zinc-500">{{ task.object.name }}</span>
                <span *ngIf="task.project && !selectedProjectId" class="px-1.5 py-0.5 rounded text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{{ task.project.name }}</span>
              </div>

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <div class="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center">
                    <iconify-icon icon="solar:user-linear" width="10" class="text-zinc-500"></iconify-icon>
                  </div>
                  <span class="text-[10px] text-zinc-500">{{ formatUser(task.assignedTo) }}</span>
                </div>
                <span *ngIf="task.slaDue" class="text-[10px] font-mono"
                  [ngClass]="isOverdue(task.slaDue) ? 'text-rose-500' : 'text-zinc-600'">
                  {{ task.slaDue | date:'MM/dd' }}
                </span>
              </div>
            </div>

            <!-- Empty column state -->
            <div *ngIf="col.tasks.length === 0" class="py-8 text-center">
              <p class="text-[10px] text-zinc-700">No tasks</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Incidents Kanban -->
      <div *ngIf="activeTab === 'incidents'" class="flex gap-4 overflow-x-auto pb-4">
        <div *ngFor="let col of incidentColumns" class="flex-shrink-0 w-80">
          <div class="flex items-center justify-between mb-3 px-1">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full"
                [ngClass]="{
                  'bg-rose-500': col.id === 'open',
                  'bg-blue-500': col.id === 'investigating',
                  'bg-amber-500': col.id === 'mitigated',
                  'bg-emerald-500': col.id === 'resolved'
                }"></span>
              <span class="text-xs font-medium text-zinc-400">{{ col.title }}</span>
            </div>
            <span class="text-[10px] text-zinc-600 font-mono bg-zinc-800/50 px-2 py-0.5 rounded">{{ col.incidents.length }}</span>
          </div>
          <div
            cdkDropList
            [cdkDropListData]="col.incidents"
            [cdkDropListConnectedTo]="getIncidentConnectedLists(col.id)"
            [id]="'inc-' + col.id"
            (cdkDropListDropped)="onIncidentDrop($event, col)"
            class="min-h-[400px] space-y-3 p-2 rounded-xl border border-white/5 bg-white/[0.01]"
          >
            <div *ngFor="let inc of col.incidents" cdkDrag [cdkDragDisabled]="!perm.canGlobal('incident', 'update')"
              class="glass-panel p-4 cursor-grab active:cursor-grabbing">
              <div class="h-0.5 rounded-full mb-3 -mt-1"
                [ngClass]="{
                  'bg-rose-500': inc.severity === 'Critical',
                  'bg-amber-500': inc.severity === 'High',
                  'bg-blue-500': inc.severity === 'Medium',
                  'bg-zinc-600': inc.severity === 'Low'
                }"></div>
              <p class="text-sm text-zinc-200 mb-2">{{ inc.title }}</p>
              <div class="flex items-center gap-2 flex-wrap mb-2">
                <span class="px-1.5 py-0.5 rounded text-[9px]"
                  [ngClass]="{
                    'bg-rose-500/10 text-rose-500': inc.severity === 'Critical',
                    'bg-amber-500/10 text-amber-500': inc.severity === 'High',
                    'bg-blue-500/10 text-blue-500': inc.severity === 'Medium',
                    'bg-zinc-500/10 text-zinc-400': inc.severity === 'Low'
                  }">{{ inc.severity }}</span>
                <span *ngIf="inc.object?.name" class="px-1.5 py-0.5 rounded text-[9px] border border-white/10 text-zinc-500">{{ inc.object.name }}</span>
              </div>
              <p class="text-[10px] text-zinc-600 font-mono">{{ inc.occurredAt | date:'yyyy-MM-dd HH:mm' }}</p>
            </div>
            <div *ngIf="col.incidents.length === 0" class="py-8 text-center">
              <p class="text-[10px] text-zinc-700">No incidents</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Task Modal -->
      <div *ngIf="showCreateForm" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="showCreateForm = false">
        <div class="glass-panel p-6 w-full max-w-lg space-y-4" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-brand font-bold text-white">Create Task</h2>
            <button (click)="showCreateForm = false" class="p-1 rounded hover:bg-white/5 transition-colors">
              <iconify-icon icon="solar:close-circle-linear" width="20" class="text-zinc-500"></iconify-icon>
            </button>
          </div>
          <div class="space-y-3">
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Title</label>
              <input type="text" [(ngModel)]="newTask.title"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Description</label>
              <textarea [(ngModel)]="newTask.description" rows="3"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors resize-none"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Priority</label>
                <select [(ngModel)]="newTask.priority"
                  class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Due Date</label>
                <input type="date" [(ngModel)]="newTask.slaDue"
                  class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
              </div>
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Project</label>
              <select [(ngModel)]="newTask.projectId"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                <option value="">No Project</option>
                <option *ngFor="let p of projects" [value]="p.id">{{ p.name }}</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Assignee</label>
                <app-user-picker [value]="newTask.assignedToId" (valueChange)="newTask.assignedToId = $event" placeholder="Select assignee..."></app-user-picker>
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Lead</label>
                <app-user-picker [value]="newTask.leadId" (valueChange)="newTask.leadId = $event" placeholder="Select lead..."></app-user-picker>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button (click)="showCreateForm = false"
              class="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400 font-brand hover:bg-white/5 transition-colors">Cancel</button>
            <button (click)="createTask()" [disabled]="!newTask.title?.trim()"
              class="px-4 py-2 bg-white text-black rounded-lg text-sm font-brand font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">Create</button>
          </div>
        </div>
      </div>

      <!-- Task Detail Modal -->
      <div *ngIf="selectedTask" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="closeTaskDetail()">
        <div class="glass-panel p-6 w-full max-w-2xl space-y-5 max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 min-w-0">
              <h2 class="text-lg font-brand font-bold text-white truncate" *ngIf="!editingTask">{{ selectedTask.title }}</h2>
              <input *ngIf="editingTask" [(ngModel)]="taskEditData.title" type="text"
                class="text-lg font-brand font-bold text-white bg-transparent border-b border-white/20 focus:outline-none flex-1 min-w-0" />
              <span class="px-2 py-0.5 rounded text-[10px] font-medium flex-shrink-0"
                [ngClass]="{
                  'bg-zinc-500/10 text-zinc-400': selectedTask.status === 'ToDo',
                  'bg-blue-500/10 text-blue-500': selectedTask.status === 'InProgress',
                  'bg-amber-500/10 text-amber-500': selectedTask.status === 'Review',
                  'bg-emerald-500/10 text-emerald-500': selectedTask.status === 'Done'
                }">{{ selectedTask.status }}</span>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <button *ngIf="!editingTask && perm.canGlobal('task', 'update')" (click)="startEditTask()"
                class="p-1.5 rounded hover:bg-white/5 transition-colors">
                <iconify-icon icon="solar:pen-linear" width="16" class="text-zinc-500"></iconify-icon>
              </button>
              <button *ngIf="editingTask" (click)="saveTask()"
                class="px-3 py-1 rounded-lg bg-white text-black text-xs font-semibold font-brand hover:bg-zinc-200 transition-colors">Save</button>
              <button *ngIf="editingTask" (click)="editingTask = false"
                class="px-3 py-1 rounded-lg border border-white/10 text-xs text-zinc-400 font-brand hover:bg-white/5 transition-colors">Cancel</button>
              <button *ngIf="perm.canGlobal('task', 'delete')" (click)="deleteTask(selectedTask.id)"
                class="p-1.5 rounded hover:bg-white/5 transition-colors">
                <iconify-icon icon="solar:trash-bin-2-linear" width="16" class="text-zinc-600 hover:text-rose-500"></iconify-icon>
              </button>
              <button (click)="closeTaskDetail()" class="p-1 rounded hover:bg-white/5 transition-colors">
                <iconify-icon icon="solar:close-circle-linear" width="20" class="text-zinc-500"></iconify-icon>
              </button>
            </div>
          </div>

          <!-- Task details -->
          <div class="grid grid-cols-2 gap-4">
            <div *ngIf="!editingTask">
              <p class="text-[10px] text-zinc-600 mb-0.5">Priority</p>
              <span class="px-2 py-0.5 rounded text-[10px]"
                [ngClass]="{
                  'bg-rose-500/10 text-rose-500': selectedTask.priority === 'Critical',
                  'bg-amber-500/10 text-amber-500': selectedTask.priority === 'High',
                  'bg-blue-500/10 text-blue-500': selectedTask.priority === 'Medium',
                  'bg-zinc-500/10 text-zinc-400': selectedTask.priority === 'Low'
                }">{{ selectedTask.priority }}</span>
            </div>
            <div *ngIf="editingTask">
              <label class="text-[10px] text-zinc-600 mb-0.5 block">Priority</label>
              <select [(ngModel)]="taskEditData.priority"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div *ngIf="!editingTask">
              <p class="text-[10px] text-zinc-600 mb-0.5">Status</p>
              <span class="text-sm text-zinc-300">{{ selectedTask.status }}</span>
            </div>
            <div *ngIf="editingTask">
              <label class="text-[10px] text-zinc-600 mb-0.5 block">Status</label>
              <select [(ngModel)]="taskEditData.status"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none">
                <option value="ToDo">To Do</option>
                <option value="InProgress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Done">Done</option>
              </select>
            </div>
            <div *ngIf="!editingTask">
              <p class="text-[10px] text-zinc-600 mb-0.5">Assignee</p>
              <p class="text-sm text-zinc-300">{{ formatUser(selectedTask.assignedTo) }}</p>
            </div>
            <div *ngIf="editingTask">
              <label class="text-[10px] text-zinc-600 mb-0.5 block">Assignee</label>
              <app-user-picker [value]="taskEditData.assignedToId" (valueChange)="taskEditData.assignedToId = $event" placeholder="Select assignee..."></app-user-picker>
            </div>
            <div *ngIf="!editingTask">
              <p class="text-[10px] text-zinc-600 mb-0.5">Lead</p>
              <p class="text-sm text-zinc-300">{{ formatUser(selectedTask.lead) }}</p>
            </div>
            <div *ngIf="editingTask">
              <label class="text-[10px] text-zinc-600 mb-0.5 block">Lead</label>
              <app-user-picker [value]="taskEditData.leadId" (valueChange)="taskEditData.leadId = $event" placeholder="Select lead..."></app-user-picker>
            </div>
            <div *ngIf="!editingTask">
              <p class="text-[10px] text-zinc-600 mb-0.5">Due Date</p>
              <p class="text-sm text-zinc-300 font-mono">{{ selectedTask.slaDue ? (selectedTask.slaDue | date:'yyyy-MM-dd') : '---' }}</p>
            </div>
            <div *ngIf="editingTask">
              <label class="text-[10px] text-zinc-600 mb-0.5 block">Due Date</label>
              <input type="date" [(ngModel)]="taskEditData.slaDue"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none" />
            </div>
          </div>

          <div *ngIf="selectedTask.object">
            <p class="text-[10px] text-zinc-600 mb-0.5">Related Object</p>
            <span class="text-sm text-zinc-300">{{ selectedTask.object.name }}</span>
            <span class="ml-2 px-1.5 py-0.5 rounded text-[9px] border border-zinc-700 bg-zinc-800/50 text-zinc-400">{{ selectedTask.object.type }}</span>
          </div>

          <div *ngIf="selectedTask.project">
            <p class="text-[10px] text-zinc-600 mb-0.5">Project</p>
            <span class="text-sm text-indigo-400">{{ selectedTask.project.name }}</span>
          </div>

          <!-- Description -->
          <div>
            <p class="text-[10px] text-zinc-600 mb-1">Description</p>
            <p *ngIf="!editingTask" class="text-sm text-zinc-400 whitespace-pre-wrap">{{ selectedTask.description || 'No description' }}</p>
            <textarea *ngIf="editingTask" [(ngModel)]="taskEditData.description" rows="4"
              class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors resize-none"></textarea>
          </div>

          <!-- Labels -->
          <div *ngIf="selectedTask.labels?.length > 0">
            <p class="text-[10px] text-zinc-600 mb-1">Labels</p>
            <div class="flex flex-wrap gap-1">
              <span *ngFor="let label of selectedTask.labels" class="px-2 py-0.5 rounded-full text-[9px] bg-white/5 border border-white/10 text-zinc-400">{{ label }}</span>
            </div>
          </div>

          <!-- Concerned section -->
          <div class="border-t border-white/5 pt-4">
            <div class="flex items-center justify-between mb-3">
              <p class="text-[10px] uppercase tracking-wider text-zinc-500">Concerned ({{ taskConcerned.length }})</p>
              <button *ngIf="perm.canGlobal('task', 'update') && !showTaskConcernedPicker" (click)="showTaskConcernedPicker = true"
                class="px-2 py-0.5 rounded text-[10px] text-zinc-400 border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-1">
                <iconify-icon icon="solar:add-circle-linear" width="10"></iconify-icon>Add
              </button>
            </div>
            <div *ngIf="showTaskConcernedPicker" class="mb-3 p-2 rounded-lg border border-white/10 bg-white/[0.02] space-y-2">
              <div class="max-w-xs">
                <app-user-picker [value]="newTaskConcernedUserId" (valueChange)="newTaskConcernedUserId = $event" placeholder="Select a person..."></app-user-picker>
              </div>
              <div class="flex justify-end gap-2">
                <button (click)="showTaskConcernedPicker = false; newTaskConcernedUserId = null" class="px-2 py-0.5 rounded text-[10px] text-zinc-500 hover:text-zinc-300">Cancel</button>
                <button (click)="addTaskConcerned()" [disabled]="!newTaskConcernedUserId"
                  class="px-2 py-0.5 rounded bg-white text-black text-[10px] font-semibold hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed">Add</button>
              </div>
            </div>
            <div class="space-y-1">
              <div *ngFor="let c of taskConcerned"
                class="flex items-center justify-between p-1.5 rounded-lg border border-white/5 bg-white/[0.01]">
                <div class="flex items-center gap-2">
                  <div class="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center">
                    <iconify-icon icon="solar:user-linear" width="10" class="text-zinc-500"></iconify-icon>
                  </div>
                  <span class="text-[11px] text-zinc-300">{{ c.firstName || '' }} {{ c.lastName || '' }}</span>
                  <span class="text-[10px] text-zinc-600">{{ c.email }}</span>
                </div>
                <button *ngIf="perm.canGlobal('task', 'update')" (click)="removeTaskConcerned(c.id)"
                  class="p-0.5 rounded hover:bg-white/5 transition-colors">
                  <iconify-icon icon="solar:close-circle-linear" width="12" class="text-zinc-600 hover:text-rose-500"></iconify-icon>
                </button>
              </div>
              <p *ngIf="taskConcerned.length === 0" class="text-[10px] text-zinc-600 text-center py-2">No concerned people</p>
            </div>
          </div>

          <!-- Comments section -->
          <div class="border-t border-white/5 pt-4">
            <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">Comments ({{ taskComments.length }})</p>
            <div class="space-y-3 max-h-48 overflow-y-auto mb-3">
              <div *ngFor="let c of taskComments" class="p-3 bg-white/[0.02] rounded-lg border border-white/5">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[10px] text-zinc-500">{{ c.authorName || c.authorId || 'System' }}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] text-zinc-600 font-mono">{{ c.createdAt | date:'yyyy-MM-dd HH:mm' }}</span>
                    <button *ngIf="perm.canGlobal('task', 'update')" (click)="deleteComment(c.id)" class="p-0.5 rounded hover:bg-white/5">
                      <iconify-icon icon="solar:close-circle-linear" width="10" class="text-zinc-700 hover:text-rose-500"></iconify-icon>
                    </button>
                  </div>
                </div>
                <p class="text-xs text-zinc-300 whitespace-pre-wrap">{{ c.content }}</p>
              </div>
              <p *ngIf="taskComments.length === 0" class="text-[10px] text-zinc-600 text-center py-2">No comments yet</p>
            </div>
            <!-- Add comment -->
            <div *ngIf="perm.canGlobal('task', 'update')" class="flex gap-2">
              <input type="text" [(ngModel)]="newComment" placeholder="Add a comment..."
                (keydown.enter)="addComment()"
                class="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:border-white/20 focus:outline-none transition-colors" />
              <button (click)="addComment()" [disabled]="!newComment.trim()"
                class="px-3 py-1.5 bg-white text-black rounded-lg text-xs font-brand font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                Send
              </button>
            </div>
          </div>

          <!-- Metadata -->
          <div class="flex items-center gap-4 text-[10px] text-zinc-600 border-t border-white/5 pt-3 flex-wrap">
            <span>Created: {{ selectedTask.createdAt | date:'yyyy-MM-dd HH:mm' }}</span>
            <span>Updated: {{ selectedTask.updatedAt | date:'yyyy-MM-dd HH:mm' }}</span>
            <span class="font-mono">{{ selectedTask.id }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RemediationKanbanComponent implements OnInit {
  activeTab: 'tasks' | 'incidents' = 'tasks';

  columns: KanbanColumn[] = [
    { id: 'ToDo', title: 'To Do', tasks: [] },
    { id: 'InProgress', title: 'In Progress', tasks: [] },
    { id: 'Review', title: 'Review', tasks: [] },
    { id: 'Done', title: 'Done', tasks: [] },
  ];

  incidentColumns: IncidentColumn[] = [
    { id: 'open', title: 'Open', incidents: [] },
    { id: 'investigating', title: 'Investigating', incidents: [] },
    { id: 'mitigated', title: 'Mitigated', incidents: [] },
    { id: 'resolved', title: 'Resolved', incidents: [] },
  ];

  totalTasks = 0;
  totalIncidents = 0;
  projects: any[] = [];
  objects: any[] = [];
  checklists: any[] = [];
  objectGroups: any[] = [];
  selectedProjectId = '';
  selectedObjectId = '';
  selectedChecklistId = '';
  selectedObjectGroupId = '';
  showMyTasks = false;
  currentUserId: string | null = null;

  // Task detail
  selectedTask: any = null;
  editingTask = false;
  taskEditData: any = {};
  taskComments: any[] = [];
  taskConcerned: any[] = [];
  newComment = '';
  showTaskConcernedPicker = false;
  newTaskConcernedUserId: string | null = null;

  // Create task
  showCreateForm = false;
  newTask: any = { title: '', description: '', priority: 'Medium', slaDue: '', projectId: '', assignedToId: null, leadId: null };

  constructor(private api: ApiService, private confirmService: ConfirmService, public perm: PermissionService) {}

  ngOnInit(): void {
    this.api.getAuthMe().subscribe({
      next: (me) => { this.currentUserId = me?.userId || me?.id || null; },
      error: () => {},
    });
    this.loadProjects();
    this.loadObjects();
    this.loadChecklists();
    this.loadObjectGroups();
    this.loadTasks();
    this.loadIncidents();
  }

  loadObjects(): void {
    this.api.getObjects().subscribe({
      next: (data) => { this.objects = data || []; },
      error: () => { this.objects = []; },
    });
  }

  loadChecklists(): void {
    this.api.getChecklists().subscribe({
      next: (data) => { this.checklists = data || []; },
      error: () => { this.checklists = []; },
    });
  }

  loadObjectGroups(): void {
    this.api.getObjectGroups().subscribe({
      next: (data) => { this.objectGroups = data || []; },
      error: () => { this.objectGroups = []; },
    });
  }

  loadProjects(): void {
    this.api.getProjects().subscribe({
      next: (data) => { this.projects = data || []; },
      error: () => { this.projects = []; },
    });
  }

  setActiveTab(tab: 'tasks' | 'incidents'): void {
    this.activeTab = tab;
    if (tab === 'tasks') this.loadTasks();
    else this.loadIncidents();
  }

  onFilterChange(): void {
    this.loadTasks();
  }

  toggleMyTasks(): void {
    this.showMyTasks = !this.showMyTasks;
    this.loadTasks();
  }

  loadTasks(): void {
    const params: any = {};
    if (this.selectedProjectId) params.projectId = this.selectedProjectId;
    if (this.selectedObjectId) params.objectId = this.selectedObjectId;
    if (this.selectedChecklistId) params.checklistId = this.selectedChecklistId;
    if (this.selectedObjectGroupId) params.objectGroupId = this.selectedObjectGroupId;
    if (this.showMyTasks && this.currentUserId) params.concernedUserId = this.currentUserId;

    this.api.getTasks(params).subscribe({
      next: (tasks) => {
        const all = tasks || [];
        this.totalTasks = all.length;

        for (const col of this.columns) {
          col.tasks = [];
        }

        for (const task of all) {
          const status = task['status'] || 'ToDo';
          const col = this.columns.find(c => c.id === status) || this.columns[0];
          col.tasks.push(task);
        }

        const priorityOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        for (const col of this.columns) {
          col.tasks.sort((a: any, b: any) =>
            (priorityOrder[a['priority']] ?? 99) - (priorityOrder[b['priority']] ?? 99)
          );
        }
      },
      error: () => {
        this.totalTasks = 0;
      },
    });
  }

  refreshTasks(): void {
    this.loadTasks();
  }

  loadIncidents(): void {
    const params: any = {};
    if (this.selectedObjectId) params['objectId'] = this.selectedObjectId;
    if (this.selectedObjectGroupId) params['groupId'] = this.selectedObjectGroupId;
    this.api.getIncidents(Object.keys(params).length ? params : undefined).subscribe({
      next: (incidents) => {
        const all = incidents || [];
        this.totalIncidents = all.length;
        for (const col of this.incidentColumns) {
          col.incidents = [];
        }
        for (const inc of all) {
          const status = (inc['status'] || 'open').toLowerCase();
          const col = this.incidentColumns.find(c => c.id === status) || this.incidentColumns[0];
          col.incidents.push(inc);
        }
      },
      error: () => { this.totalIncidents = 0; },
    });
  }

  refreshIncidents(): void {
    this.loadIncidents();
  }

  getIncidentConnectedLists(currentId: string): string[] {
    return this.incidentColumns.filter(c => c.id !== currentId).map(c => 'inc-' + c.id);
  }

  onIncidentDrop(event: CdkDragDrop<any[]>, targetColumn: IncidentColumn): void {
    if (!this.perm.canGlobal('incident', 'update')) return;
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      const incident = event.container.data[event.currentIndex];
      if (incident && incident['id']) {
        this.api.updateIncident(incident['id'], { status: targetColumn.id }).subscribe({
          next: () => { /* success */ },
          error: (err) => {
            console.error('[OSCI] Failed to update incident status:', err);
            this.loadIncidents();
          },
        });
      }
    }
  }

  getConnectedLists(currentId: string): string[] {
    return this.columns.filter(c => c.id !== currentId).map(c => c.id);
  }

  onDrop(event: CdkDragDrop<any[]>, targetColumn: KanbanColumn): void {
    if (!this.perm.canGlobal('task', 'update')) return;
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      const task = event.container.data[event.currentIndex];
      if (task && task['id']) {
        this.api.updateTask(task['id'], { status: targetColumn.id }).subscribe({
          error: (err) => console.error('[OSCI] Failed to update task status:', err),
        });
      }
    }
  }

  isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }

  // --- Task Detail ---

  openTaskDetail(task: any): void {
    this.selectedTask = task;
    this.editingTask = false;
    this.newComment = '';
    this.showTaskConcernedPicker = false;
    this.newTaskConcernedUserId = null;
    this.loadTaskComments(task.id);
    this.loadTaskConcerned(task.id);
  }

  closeTaskDetail(): void {
    this.selectedTask = null;
    this.editingTask = false;
    this.taskComments = [];
    this.taskConcerned = [];
  }

  startEditTask(): void {
    this.taskEditData = {
      title: this.selectedTask.title,
      description: this.selectedTask.description || '',
      priority: this.selectedTask.priority,
      status: this.selectedTask.status,
      assignedToId: this.selectedTask.assignedToId || null,
      leadId: this.selectedTask.leadId || null,
      slaDue: this.selectedTask.slaDue ? new Date(this.selectedTask.slaDue).toISOString().split('T')[0] : '',
    };
    this.editingTask = true;
  }

  saveTask(): void {
    const payload: any = {};
    if (this.taskEditData.title !== this.selectedTask.title) payload.title = this.taskEditData.title;
    if (this.taskEditData.description !== (this.selectedTask.description || '')) payload.description = this.taskEditData.description;
    if (this.taskEditData.priority !== this.selectedTask.priority) payload.priority = this.taskEditData.priority;
    if (this.taskEditData.status !== this.selectedTask.status) payload.status = this.taskEditData.status;
    if (this.taskEditData.assignedToId !== (this.selectedTask.assignedToId || null)) payload.assignedToId = this.taskEditData.assignedToId || null;
    if (this.taskEditData.leadId !== (this.selectedTask.leadId || null)) payload.leadId = this.taskEditData.leadId || null;
    const origSlaDue = this.selectedTask.slaDue ? new Date(this.selectedTask.slaDue).toISOString().split('T')[0] : '';
    if (this.taskEditData.slaDue !== origSlaDue) payload.slaDue = this.taskEditData.slaDue || null;

    this.api.updateTask(this.selectedTask.id, payload).subscribe({
      next: (updated) => {
        Object.assign(this.selectedTask, updated);
        this.editingTask = false;
        this.loadTasks();
      },
      error: (err) => console.error('[OSCI] Failed to update task:', err),
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
        this.closeTaskDetail();
        this.loadTasks();
      },
      error: (err) => console.error('[OSCI] Failed to delete task:', err),
    });
  }

  // --- Task Concerned ---

  loadTaskConcerned(taskId: string): void {
    this.api.getTaskConcerned(taskId).subscribe({
      next: (data) => { this.taskConcerned = data || []; },
      error: () => { this.taskConcerned = []; },
    });
  }

  addTaskConcerned(): void {
    if (!this.newTaskConcernedUserId || !this.selectedTask) return;
    this.api.addTaskConcerned(this.selectedTask.id, this.newTaskConcernedUserId).subscribe({
      next: () => {
        this.showTaskConcernedPicker = false;
        this.newTaskConcernedUserId = null;
        this.loadTaskConcerned(this.selectedTask.id);
      },
    });
  }

  removeTaskConcerned(userId: string): void {
    if (!this.selectedTask) return;
    this.api.removeTaskConcerned(this.selectedTask.id, userId).subscribe({
      next: () => this.loadTaskConcerned(this.selectedTask.id),
    });
  }

  // --- Comments ---

  loadTaskComments(taskId: string): void {
    this.api.getTaskComments(taskId).subscribe({
      next: (data) => { this.taskComments = data || []; },
      error: () => { this.taskComments = []; },
    });
  }

  addComment(): void {
    if (!this.newComment.trim() || !this.selectedTask) return;
    this.api.createTaskComment(this.selectedTask.id, { content: this.newComment }).subscribe({
      next: () => {
        this.newComment = '';
        this.loadTaskComments(this.selectedTask.id);
      },
      error: (err) => console.error('[OSCI] Failed to add comment:', err),
    });
  }

  deleteComment(commentId: string): void {
    if (!this.selectedTask) return;
    this.api.deleteTaskComment(this.selectedTask.id, commentId).subscribe({
      next: () => this.loadTaskComments(this.selectedTask.id),
      error: (err) => console.error('[OSCI] Failed to delete comment:', err),
    });
  }

  // --- Create Task ---

  createTask(): void {
    if (!this.newTask.title?.trim()) return;
    const payload: any = {
      title: this.newTask.title,
      priority: this.newTask.priority || 'Medium',
    };
    if (this.newTask.description?.trim()) payload.description = this.newTask.description;
    if (this.newTask.slaDue) payload.slaDue = this.newTask.slaDue;
    if (this.newTask.projectId) payload.projectId = this.newTask.projectId;
    if (this.newTask.assignedToId) payload.assignedToId = this.newTask.assignedToId;
    if (this.newTask.leadId) payload.leadId = this.newTask.leadId;

    this.api.createTask(payload).subscribe({
      next: () => {
        this.showCreateForm = false;
        this.newTask = { title: '', description: '', priority: 'Medium', slaDue: '', projectId: '', assignedToId: null, leadId: null };
        this.loadTasks();
      },
      error: (err) => console.error('[OSCI] Failed to create task:', err),
    });
  }

  // --- Helpers ---

  formatUser(user: any): string {
    if (!user) return 'Unassigned';
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
    return name || user.email || 'Unknown';
  }
}
