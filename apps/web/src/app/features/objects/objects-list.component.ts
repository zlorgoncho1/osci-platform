import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-objects-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-brand font-bold text-white">Objects</h1>
          <p class="text-xs text-zinc-500 mt-1">Managed security objects inventory
            <a routerLink="/app/docs/module-objects"
               class="inline-flex items-center gap-1 ml-3 text-zinc-600 hover:text-emerald-400 transition-colors">
              <iconify-icon icon="solar:book-2-linear" width="12"></iconify-icon>
              <span class="text-[10px]">Guide</span>
            </a>
          </p>
        </div>
        <button *ngIf="activeTab === 'objects' && perm.canGlobal('object', 'create')" (click)="showCreateModal = true"
          class="px-4 py-2 bg-white text-black rounded-lg text-sm font-brand font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2">
          <iconify-icon icon="solar:add-circle-linear" width="16"></iconify-icon>
          New Object
        </button>
        <button *ngIf="activeTab === 'groups' && perm.canGlobal('object_group', 'create')" (click)="showCreateGroupModal = true"
          class="px-4 py-2 bg-white text-black rounded-lg text-sm font-brand font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2">
          <iconify-icon icon="solar:add-circle-linear" width="16"></iconify-icon>
          New Group
        </button>
      </div>

      <!-- Tab Switcher -->
      <div class="flex items-center gap-1 bg-zinc-900/50 rounded-lg p-1 w-fit border border-white/5">
        <button (click)="activeTab = 'objects'"
          class="px-4 py-1.5 rounded-md text-xs font-brand font-medium transition-colors"
          [ngClass]="activeTab === 'objects' ? 'bg-white text-black' : 'text-zinc-400 hover:text-zinc-200'">
          <iconify-icon icon="solar:box-linear" width="14" class="mr-1.5"></iconify-icon>
          Objects
        </button>
        <button (click)="activeTab = 'groups'; loadGroups()"
          class="px-4 py-1.5 rounded-md text-xs font-brand font-medium transition-colors"
          [ngClass]="activeTab === 'groups' ? 'bg-white text-black' : 'text-zinc-400 hover:text-zinc-200'">
          <iconify-icon icon="solar:layers-linear" width="14" class="mr-1.5"></iconify-icon>
          Groups
        </button>
      </div>

      <!-- Objects Tab -->
      <ng-container *ngIf="activeTab === 'objects'">
        <!-- Filter bar -->
        <div class="glass-panel p-4 flex items-center gap-4">
          <div class="relative flex-1">
            <iconify-icon icon="solar:magnifer-linear" width="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"></iconify-icon>
            <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="filterObjects()" placeholder="Search objects..."
              class="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:border-white/20 focus:outline-none transition-colors" />
          </div>
          <select [(ngModel)]="selectedType" (ngModelChange)="filterObjects()"
            class="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
            <option value="">All Types</option>
            <option *ngFor="let t of objectTypes" [value]="t">{{ t }}</option>
          </select>
        </div>

        <!-- Table -->
        <div class="glass-panel overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="border-b border-white/[0.08]">
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Name</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Type</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Score</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Created</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let obj of filteredObjects" (click)="navigateToDetail(obj.id)"
                class="border-b border-white/[0.06] table-row-hover cursor-pointer">
                <td class="p-4 text-sm text-zinc-200">{{ obj.name }}</td>
                <td class="p-4">
                  <span class="px-2 py-0.5 rounded border border-zinc-600 bg-zinc-800/60 text-zinc-300 text-[10px]">{{ obj.type }}</span>
                </td>
                <td class="p-4 text-sm font-mono" [ngClass]="getScoreTextClass(obj.score)">{{ obj.score !== undefined && obj.score !== null ? obj.score + '%' : '---' }}</td>
                <td class="p-4 text-xs text-zinc-400 font-mono">{{ obj.createdAt | date:'yyyy-MM-dd' }}</td>
                <td class="p-4">
                  <span class="w-2 h-2 rounded-full inline-block"
                    [ngClass]="obj.score >= 80 ? 'bg-emerald-500' : obj.score >= 40 ? 'bg-amber-500' : 'bg-rose-500'"></span>
                </td>
              </tr>
              <tr *ngIf="filteredObjects.length === 0">
                <td colspan="5" class="p-8 text-center text-xs text-zinc-500">
                  <iconify-icon icon="solar:box-linear" width="32" class="text-zinc-700 mb-2"></iconify-icon>
                  <p>No objects found</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ng-container>

      <!-- Groups Tab -->
      <ng-container *ngIf="activeTab === 'groups'">
        <!-- Filter bar -->
        <div class="glass-panel p-4 flex items-center gap-4">
          <div class="relative flex-1">
            <iconify-icon icon="solar:magnifer-linear" width="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"></iconify-icon>
            <input type="text" [(ngModel)]="groupSearchTerm" (ngModelChange)="filterGroups()" placeholder="Search groups..."
              class="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:border-white/20 focus:outline-none transition-colors" />
          </div>
        </div>

        <!-- Groups Table -->
        <div class="glass-panel overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="border-b border-white/[0.08]">
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Name</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Members</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Description</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let group of filteredGroups" (click)="navigateToGroupDetail(group.id)"
                class="border-b border-white/[0.06] table-row-hover cursor-pointer">
                <td class="p-4">
                  <div class="flex items-center gap-2">
                    <iconify-icon icon="solar:layers-linear" width="16" class="text-zinc-500"></iconify-icon>
                    <span class="text-sm text-zinc-200">{{ group.name }}</span>
                  </div>
                </td>
                <td class="p-4">
                  <span class="px-2 py-0.5 rounded border border-zinc-600 bg-zinc-800/60 text-zinc-300 text-[10px] font-mono">{{ group.objects?.length || 0 }} objects</span>
                </td>
                <td class="p-4 text-xs text-zinc-400">{{ group.description || '---' }}</td>
                <td class="p-4 text-xs text-zinc-400 font-mono">{{ group.createdAt | date:'yyyy-MM-dd' }}</td>
              </tr>
              <tr *ngIf="filteredGroups.length === 0">
                <td colspan="4" class="p-8 text-center text-xs text-zinc-500">
                  <iconify-icon icon="solar:layers-linear" width="32" class="text-zinc-700 mb-2"></iconify-icon>
                  <p>No groups found</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ng-container>

      <!-- Create Object Modal -->
      <div *ngIf="showCreateModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="showCreateModal = false">
        <div class="glass-panel p-6 w-full max-w-lg space-y-4" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-brand font-bold text-white">Create Object</h2>
            <button (click)="showCreateModal = false" class="p-1 rounded hover:bg-white/5 transition-colors">
              <iconify-icon icon="solar:close-circle-linear" width="20" class="text-zinc-500"></iconify-icon>
            </button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Name</label>
              <input type="text" [(ngModel)]="newObject.name"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-400 mb-1 block">Type</label>
              <select [(ngModel)]="newObject.type"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                <option *ngFor="let t of objectTypes" [value]="t">{{ t }}</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-400 mb-1 block">Description</label>
              <textarea [(ngModel)]="newObject.description" rows="3"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors resize-none"></textarea>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button (click)="showCreateModal = false"
              class="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400 font-brand hover:bg-white/5 transition-colors">Cancel</button>
            <button (click)="createObject()"
              class="px-4 py-2 bg-white text-black rounded-lg text-sm font-brand font-semibold hover:bg-zinc-200 transition-colors">Create</button>
          </div>
        </div>
      </div>

      <!-- Create Group Modal -->
      <div *ngIf="showCreateGroupModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="showCreateGroupModal = false">
        <div class="glass-panel p-6 w-full max-w-lg space-y-4" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-brand font-bold text-white">Create Group</h2>
            <button (click)="showCreateGroupModal = false" class="p-1 rounded hover:bg-white/5 transition-colors">
              <iconify-icon icon="solar:close-circle-linear" width="20" class="text-zinc-500"></iconify-icon>
            </button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Name</label>
              <input type="text" [(ngModel)]="newGroup.name"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-400 mb-1 block">Description</label>
              <textarea [(ngModel)]="newGroup.description" rows="3"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors resize-none"></textarea>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button (click)="showCreateGroupModal = false"
              class="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400 font-brand hover:bg-white/5 transition-colors">Cancel</button>
            <button (click)="createGroup()"
              class="px-4 py-2 bg-white text-black rounded-lg text-sm font-brand font-semibold hover:bg-zinc-200 transition-colors">Create</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ObjectsListComponent implements OnInit {
  objectTypes = ['Project', 'Human', 'Infrastructure', 'Codebase', 'Pipeline', 'Cluster', 'DataAsset', 'Tool', 'Network', 'AISystem', 'SystemTool', 'AgentTool', 'Server', 'Database'];
  objects: any[] = [];
  filteredObjects: any[] = [];
  searchTerm = '';
  selectedType = '';
  showCreateModal = false;
  newObject = { name: '', type: 'Infrastructure', description: '' };

  activeTab: 'objects' | 'groups' = 'objects';
  groups: any[] = [];
  filteredGroups: any[] = [];
  groupSearchTerm = '';
  showCreateGroupModal = false;
  newGroup = { name: '', description: '' };

  constructor(private api: ApiService, private router: Router, public perm: PermissionService) {}

  ngOnInit(): void {
    this.loadObjects();
  }

  loadObjects(): void {
    this.api.getObjects().subscribe({
      next: (data) => {
        this.objects = data || [];
        this.filterObjects();
      },
      error: () => {
        this.objects = [];
        this.filteredObjects = [];
      },
    });
  }

  filterObjects(): void {
    this.filteredObjects = this.objects.filter((obj) => {
      const matchesSearch = !this.searchTerm ||
        obj['name']?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesType = !this.selectedType || obj['type'] === this.selectedType;
      return matchesSearch && matchesType;
    });
  }

  navigateToDetail(id: string): void {
    this.router.navigate(['/app/objects', id]);
  }

  createObject(): void {
    if (!this.newObject.name.trim()) return;
    this.api.createObject(this.newObject).subscribe({
      next: () => {
        this.showCreateModal = false;
        this.newObject = { name: '', type: 'Infrastructure', description: '' };
        this.loadObjects();
      },
      error: (err) => console.error('[OSCI] Failed to create object:', err),
    });
  }

  getScoreTextClass(score: number): string {
    if (score === undefined || score === null) return 'text-zinc-600';
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-rose-500';
  }

  // Groups
  loadGroups(): void {
    this.api.getObjectGroups().subscribe({
      next: (data) => {
        this.groups = data || [];
        this.filterGroups();
      },
      error: () => {
        this.groups = [];
        this.filteredGroups = [];
      },
    });
  }

  filterGroups(): void {
    this.filteredGroups = this.groups.filter((g) => {
      return !this.groupSearchTerm ||
        g['name']?.toLowerCase().includes(this.groupSearchTerm.toLowerCase());
    });
  }

  navigateToGroupDetail(id: string): void {
    this.router.navigate(['/app/object-groups', id]);
  }

  createGroup(): void {
    if (!this.newGroup.name.trim()) return;
    this.api.createObjectGroup(this.newGroup).subscribe({
      next: () => {
        this.showCreateGroupModal = false;
        this.newGroup = { name: '', description: '' };
        this.loadGroups();
      },
      error: (err) => console.error('[OSCI] Failed to create group:', err),
    });
  }
}
