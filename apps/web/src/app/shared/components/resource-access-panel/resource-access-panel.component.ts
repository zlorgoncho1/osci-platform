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
  template: `
    <div class="bg-zinc-900/50 border border-white/10 rounded-xl p-4 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-white flex items-center gap-2">
          <iconify-icon icon="solar:shield-user-linear" width="16"></iconify-icon>
          Access Control
        </h3>
        <button *ngIf="canManage" (click)="showAddForm = !showAddForm"
          class="px-2 py-1 text-xs bg-emerald-600/20 text-emerald-400 rounded hover:bg-emerald-600/30 transition-colors">
          + Grant Access
        </button>
      </div>

      <!-- Add form -->
      <div *ngIf="showAddForm && canManage" class="bg-zinc-800/50 rounded-lg p-3 space-y-3">
        <div>
          <label class="block text-[10px] text-zinc-500 uppercase mb-1">User</label>
          <select [(ngModel)]="newUserId"
            class="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none">
            <option value="">Select user...</option>
            <option *ngFor="let user of availableUsers" [value]="user.id">
              {{ user.firstName || '' }} {{ user.lastName || '' }} ({{ user.email }})
            </option>
          </select>
        </div>
        <div>
          <label class="block text-[10px] text-zinc-500 uppercase mb-1">Actions</label>
          <div class="flex flex-wrap gap-2">
            <label *ngFor="let action of allActions" class="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" [checked]="newActions.has(action)" (change)="toggleNewAction(action)"
                class="w-3 h-3 rounded border-zinc-600 bg-zinc-800 text-emerald-500" />
              <span class="text-xs text-zinc-300">{{ action }}</span>
            </label>
          </div>
        </div>
        <button (click)="grantAccess()"
          [disabled]="!newUserId || newActions.size === 0"
          class="px-3 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-500 disabled:opacity-50 transition-colors">
          Grant
        </button>
      </div>

      <!-- Access list -->
      <div *ngFor="let access of accesses" class="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
        <div class="flex-1 min-w-0">
          <p class="text-xs text-zinc-200 truncate">
            {{ access.user?.firstName || '' }} {{ access.user?.lastName || '' }}
            <span class="text-zinc-500">({{ access.user?.email }})</span>
          </p>
          <div class="flex flex-wrap gap-1 mt-1">
            <span *ngFor="let action of access.actions"
              class="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400">{{ action }}</span>
          </div>
        </div>
        <button *ngIf="canManage" (click)="revokeAccess(access.userId)"
          class="ml-2 p-1 rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors">
          <iconify-icon icon="solar:close-circle-linear" width="14"></iconify-icon>
        </button>
      </div>

      <p *ngIf="accesses.length === 0" class="text-xs text-zinc-500 text-center py-2">
        No explicit access entries
      </p>
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
