import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { PermissionService } from '../../core/services/permission.service';
import { ConfirmService } from '../../shared/components/confirm/confirm.service';
import { ScoreGaugeComponent } from '../../shared/components/score-gauge/score-gauge.component';

@Component({
  selector: 'app-object-group-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ScoreGaugeComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="space-y-6" *ngIf="group">
      <!-- Back + Actions -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a routerLink="/app/objects" class="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <iconify-icon icon="solar:arrow-left-linear" width="18" class="text-zinc-500"></iconify-icon>
          </a>
          <div>
            <h1 class="text-2xl font-brand font-bold text-white">{{ group.name }}</h1>
            <div class="flex items-center gap-3 mt-1">
              <span class="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800/50 text-zinc-400 text-[10px]">Group</span>
              <span class="text-[10px] text-zinc-600 font-mono">{{ group.objects?.length || 0 }} members</span>
              <span class="text-[10px] text-zinc-600 font-mono">ID: {{ group.id }}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button *ngIf="perm.canGlobal('object_group', 'update')" (click)="isEditing = !isEditing"
            class="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 font-brand hover:bg-white/5 transition-colors flex items-center gap-2">
            <iconify-icon icon="solar:pen-linear" width="14"></iconify-icon>Edit
          </button>
          <button *ngIf="perm.canGlobal('object_group', 'delete')" (click)="deleteGroup()"
            class="px-3 py-1.5 rounded-lg border border-rose-500/20 text-xs text-rose-500 font-brand hover:bg-rose-500/10 transition-colors flex items-center gap-2">
            <iconify-icon icon="solar:trash-bin-trash-linear" width="14"></iconify-icon>Delete
          </button>
        </div>
      </div>

      <!-- Info + Score row -->
      <div class="grid grid-cols-12 gap-6">
        <!-- Group Info -->
        <div class="col-span-8 glass-panel p-6 space-y-4">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Group Information</p>

          <div *ngIf="!isEditing" class="space-y-3">
            <div>
              <p class="text-[10px] text-zinc-600 mb-0.5">Description</p>
              <p class="text-sm text-zinc-300">{{ group.description || 'No description provided' }}</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-[10px] text-zinc-600 mb-0.5">Created</p>
                <p class="text-sm text-zinc-300 font-mono">{{ group.createdAt | date:'yyyy-MM-dd' }}</p>
              </div>
              <div>
                <p class="text-[10px] text-zinc-600 mb-0.5">Last Updated</p>
                <p class="text-sm text-zinc-300 font-mono">{{ group.updatedAt | date:'yyyy-MM-dd' }}</p>
              </div>
            </div>
          </div>

          <div *ngIf="isEditing" class="space-y-3">
            <div>
              <label class="text-[10px] text-zinc-600 mb-0.5 block">Name</label>
              <input type="text" [(ngModel)]="editData.name"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
            </div>
            <div>
              <label class="text-[10px] text-zinc-600 mb-0.5 block">Description</label>
              <textarea [(ngModel)]="editData.description" rows="3"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors resize-none"></textarea>
            </div>
            <div class="flex gap-2">
              <button (click)="saveEdit()"
                class="px-4 py-2 bg-white text-black rounded-lg text-sm font-brand font-semibold hover:bg-zinc-200 transition-colors">Save</button>
              <button (click)="isEditing = false"
                class="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400 font-brand hover:bg-white/5 transition-colors">Cancel</button>
            </div>
          </div>
        </div>

        <!-- Score -->
        <div class="col-span-4 glass-panel p-6 flex flex-col items-center justify-center">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-4">Aggregate Score</p>
          <app-score-gauge [score]="groupScore?.averageScore || 0" size="lg"></app-score-gauge>
          <p class="text-[10px] text-zinc-500 mt-2">Average of {{ group.objects?.length || 0 }} members</p>
        </div>
      </div>

      <!-- Members Table -->
      <div class="glass-panel p-6">
        <div class="flex items-center justify-between mb-4">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500">Members</p>
        </div>
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/[0.08]">
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-3 font-medium">Name</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-3 font-medium">Type</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-3 font-medium">Score</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let obj of group.objects" class="border-b border-white/[0.06] table-row-hover">
              <td class="p-3">
                <a [routerLink]="['/app/objects', obj.id]" class="text-sm text-zinc-200 hover:text-white transition-colors hover:underline">{{ obj.name }}</a>
              </td>
              <td class="p-3">
                <span class="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800/50 text-zinc-400 text-[10px]">{{ obj.type }}</span>
              </td>
              <td class="p-3 text-sm font-mono" [ngClass]="getScoreClass(getObjectScore(obj.id))">
                {{ getObjectScore(obj.id) !== null ? getObjectScore(obj.id) + '%' : '---' }}
              </td>
              <td class="p-3">
                <button *ngIf="perm.canGlobal('object_group', 'update')" (click)="removeMember(obj.id)"
                  class="px-2 py-1 rounded-lg border border-rose-500/20 text-[10px] text-rose-500 font-brand hover:bg-rose-500/10 transition-colors">
                  Remove
                </button>
              </td>
            </tr>
            <tr *ngIf="!group.objects || group.objects.length === 0">
              <td colspan="4" class="p-8 text-center text-xs text-zinc-500">
                <iconify-icon icon="solar:box-linear" width="32" class="text-zinc-700 mb-2"></iconify-icon>
                <p>No members in this group</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add Members -->
      <div class="glass-panel p-6" *ngIf="perm.canGlobal('object_group', 'update')">
        <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-4">Add Members</p>

        <div class="relative mb-4">
          <iconify-icon icon="solar:magnifer-linear" width="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"></iconify-icon>
          <input type="text" [(ngModel)]="addMemberSearch" (ngModelChange)="filterAvailableObjects()" placeholder="Search available objects..."
            class="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:border-white/20 focus:outline-none transition-colors" />
        </div>

        <div class="space-y-1 max-h-64 overflow-y-auto" *ngIf="filteredAvailableObjects.length > 0">
          <div *ngFor="let obj of filteredAvailableObjects"
            class="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5 hover:border-white/10 transition-colors">
            <div class="flex items-center gap-3">
              <input type="checkbox" [checked]="selectedObjectIds.has(obj.id)" (change)="toggleObjectSelection(obj.id)"
                class="rounded border-zinc-600 bg-zinc-900 text-white focus:ring-0 focus:ring-offset-0" />
              <div>
                <p class="text-sm text-zinc-300">{{ obj.name }}</p>
                <span class="px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800/50 text-zinc-500 text-[10px]">{{ obj.type }}</span>
              </div>
            </div>
          </div>
        </div>
        <p *ngIf="filteredAvailableObjects.length === 0" class="text-[10px] text-zinc-600 text-center py-4">
          {{ allObjects.length === 0 ? 'No objects available' : 'All objects are already members' }}
        </p>

        <button *ngIf="selectedObjectIds.size > 0" (click)="addSelectedMembers()"
          class="mt-4 px-4 py-2 bg-white text-black rounded-lg text-sm font-brand font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2">
          <iconify-icon icon="solar:add-circle-linear" width="16"></iconify-icon>
          Add {{ selectedObjectIds.size }} object{{ selectedObjectIds.size > 1 ? 's' : '' }}
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div *ngIf="!group && !loadError" class="flex items-center justify-center py-20">
      <div class="text-center space-y-3">
        <iconify-icon icon="solar:refresh-linear" width="24" class="text-zinc-600 animate-spin"></iconify-icon>
        <p class="text-xs text-zinc-600">Loading group...</p>
      </div>
    </div>

    <!-- Error state -->
    <div *ngIf="loadError" class="flex items-center justify-center py-20">
      <div class="text-center space-y-3">
        <iconify-icon icon="solar:danger-triangle-linear" width="32" class="text-rose-500"></iconify-icon>
        <p class="text-sm text-zinc-400">Group not found</p>
        <a routerLink="/app/objects" class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">&larr; Back to Objects</a>
      </div>
    </div>
  `,
})
export class ObjectGroupDetailComponent implements OnInit {
  group: any = null;
  groupScore: any = null;
  allObjects: any[] = [];
  filteredAvailableObjects: any[] = [];
  addMemberSearch = '';
  selectedObjectIds = new Set<string>();
  isEditing = false;
  editData = { name: '', description: '' };
  loadError = false;

  private groupId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private confirmService: ConfirmService,
    public perm: PermissionService,
  ) {}

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('id') || '';
    if (this.groupId) {
      this.loadGroup();
    }
  }

  private loadGroup(): void {
    this.api.getObjectGroup(this.groupId).subscribe({
      next: (data) => {
        this.group = data;
        this.editData = { name: data['name'], description: data['description'] || '' };
        this.loadGroupScore();
        this.loadAllObjects();
      },
      error: () => {
        this.loadError = true;
      },
    });
  }

  private loadGroupScore(): void {
    this.api.getGroupScore(this.groupId).subscribe({
      next: (data) => { this.groupScore = data; },
      error: () => {},
    });
  }

  private loadAllObjects(): void {
    this.api.getObjects().subscribe({
      next: (data) => {
        this.allObjects = data || [];
        this.filterAvailableObjects();
      },
      error: () => {},
    });
  }

  filterAvailableObjects(): void {
    const memberIds = new Set((this.group?.objects || []).map((o: any) => o.id));
    this.filteredAvailableObjects = this.allObjects.filter((obj) => {
      if (memberIds.has(obj.id)) return false;
      if (this.addMemberSearch) {
        return obj.name?.toLowerCase().includes(this.addMemberSearch.toLowerCase());
      }
      return true;
    });
  }

  toggleObjectSelection(id: string): void {
    if (this.selectedObjectIds.has(id)) {
      this.selectedObjectIds.delete(id);
    } else {
      this.selectedObjectIds.add(id);
    }
  }

  addSelectedMembers(): void {
    const ids = Array.from(this.selectedObjectIds);
    this.api.addGroupMembers(this.groupId, ids).subscribe({
      next: (data) => {
        this.group = data;
        this.selectedObjectIds.clear();
        this.filterAvailableObjects();
        this.loadGroupScore();
      },
      error: (err) => console.error('[OSCI] Failed to add members:', err),
    });
  }

  removeMember(objectId: string): void {
    this.api.removeGroupMembers(this.groupId, [objectId]).subscribe({
      next: (data) => {
        this.group = data;
        this.filterAvailableObjects();
        this.loadGroupScore();
      },
      error: (err) => console.error('[OSCI] Failed to remove member:', err),
    });
  }

  saveEdit(): void {
    this.api.updateObjectGroup(this.groupId, this.editData).subscribe({
      next: (data) => {
        this.group = { ...this.group, ...data };
        this.isEditing = false;
      },
      error: (err) => console.error('[OSCI] Failed to update:', err),
    });
  }

  async deleteGroup(): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: 'Supprimer le groupe',
      message: 'Supprimer ce groupe ? Les objets ne seront pas supprimés.',
      confirmText: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    this.api.deleteObjectGroup(this.groupId).subscribe({
      next: () => { this.router.navigate(['/app/objects']); },
      error: (err) => console.error('[OSCI] Failed to delete:', err),
    });
  }

  getObjectScore(objectId: string): number | null {
    if (!this.groupScore?.objectScores) return null;
    const entry = this.groupScore.objectScores.find((s: any) => s.objectId === objectId);
    return entry?.score ?? null;
  }

  getScoreClass(score: number | null): string {
    if (score === null || score === undefined) return 'text-zinc-600';
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-rose-500';
  }
}
