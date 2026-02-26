import { Component, Input, OnInit, OnChanges, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { PermissionService } from '../../../core/services/permission.service';

const ALL_ACTIONS = ['read', 'create', 'update', 'delete', 'export', 'manage'];

@Component({
  selector: 'app-resource-access-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styles: [`:host { display: block; }`],
  template: `
    <div class="glass-panel p-6 space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-[10px] uppercase tracking-wider text-zinc-500 flex items-center gap-2">
          <iconify-icon icon="solar:shield-user-linear" width="14"></iconify-icon>
          Access Control
        </p>
        <button *ngIf="canManage" (click)="showAddForm = !showAddForm"
          class="px-2 py-1 rounded-lg border border-white/10 text-[10px] text-zinc-400 font-brand hover:bg-white/5 transition-colors flex items-center gap-1">
          <iconify-icon icon="solar:add-circle-linear" width="12"></iconify-icon>Grant
        </button>
      </div>

      <!-- Add form -->
      <div *ngIf="showAddForm && canManage" class="p-3 rounded-lg border border-white/10 bg-white/[0.02] space-y-3">
        <div>
          <label class="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">User</label>
          <select [(ngModel)]="newUserId"
            class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none">
            <option value="">Select user...</option>
            <option *ngFor="let user of availableUsers" [value]="user.id">
              {{ user.firstName || '' }} {{ user.lastName || '' }} ({{ user.email }})
            </option>
          </select>
        </div>
        <div>
          <label class="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Actions</label>
          <div class="flex flex-wrap gap-3">
            <label *ngFor="let action of allActions" class="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" [checked]="newActions.has(action)" (change)="toggleNewAction(action)"
                class="w-3 h-3 rounded border-zinc-600 bg-zinc-800 text-emerald-500" />
              <span class="text-xs text-zinc-300">{{ action }}</span>
            </label>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <button (click)="showAddForm = false" class="px-3 py-1 rounded text-[10px] text-zinc-500 font-brand hover:text-zinc-300">Cancel</button>
          <button (click)="grantAccess()"
            [disabled]="!newUserId || newActions.size === 0"
            class="px-3 py-1 rounded bg-white text-black text-[10px] font-semibold font-brand hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed">Grant</button>
        </div>
      </div>

      <!-- Access list -->
      <div class="space-y-2">
        <div *ngFor="let access of accesses"
          class="flex items-center justify-between p-2 rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <div class="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <iconify-icon icon="solar:user-linear" width="12" class="text-zinc-500"></iconify-icon>
            </div>
            <div class="min-w-0">
              <p class="text-xs text-zinc-200 truncate">
                {{ access.user?.firstName || '' }} {{ access.user?.lastName || '' }}
                <span class="text-zinc-600">({{ access.user?.email }})</span>
              </p>
              <div class="flex flex-wrap gap-1 mt-0.5">
                <span *ngFor="let action of access.actions"
                  class="px-1.5 py-0.5 rounded text-[9px] bg-zinc-800 text-zinc-500">{{ action }}</span>
              </div>
            </div>
          </div>
          <button *ngIf="canManage" (click)="revokeAccess(access.userId)"
            class="p-1 rounded hover:bg-white/5 transition-colors flex-shrink-0">
            <iconify-icon icon="solar:close-circle-linear" width="14" class="text-zinc-600 hover:text-rose-500"></iconify-icon>
          </button>
        </div>
        <div *ngIf="accesses.length === 0" class="py-4 text-center text-[10px] text-zinc-600">
          No explicit access entries
        </div>
      </div>
    </div>
  `,
})
export class ResourceAccessPanelComponent implements OnInit, OnChanges {
  @Input() resourceType!: string;
  @Input() resourceId!: string;

  accesses: any[] = [];
  availableUsers: any[] = [];
  showAddForm = false;
  newUserId = '';
  newActions = new Set<string>(['read']);
  allActions = ALL_ACTIONS;

  constructor(
    private api: ApiService,
    private permissionService: PermissionService,
  ) {}

  get canManage(): boolean {
    return this.permissionService.canResource(
      this.resourceType,
      this.resourceId,
      'manage',
    );
  }

  ngOnInit(): void {
    this.loadAccesses();
    this.api.getUsers().subscribe((users) => {
      this.availableUsers = users;
    });
  }

  ngOnChanges(): void {
    if (this.resourceType && this.resourceId) {
      this.loadAccesses();
    }
  }

  loadAccesses(): void {
    if (!this.resourceType || !this.resourceId) return;
    this.api
      .getResourceAccess(this.resourceType, this.resourceId)
      .subscribe((accesses) => {
        this.accesses = accesses;
      });
  }

  toggleNewAction(action: string): void {
    if (this.newActions.has(action)) {
      this.newActions.delete(action);
    } else {
      this.newActions.add(action);
    }
  }

  grantAccess(): void {
    if (!this.newUserId || this.newActions.size === 0) return;
    this.api
      .grantResourceAccess(
        this.resourceType,
        this.resourceId,
        this.newUserId,
        Array.from(this.newActions),
      )
      .subscribe(() => {
        this.loadAccesses();
        this.newUserId = '';
        this.newActions = new Set(['read']);
        this.showAddForm = false;
      });
  }

  revokeAccess(userId: string): void {
    this.api
      .revokeResourceAccess(this.resourceType, this.resourceId, userId)
      .subscribe(() => {
        this.loadAccesses();
      });
  }
}
