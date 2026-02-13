import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { PermissionService } from '../../core/services/permission.service';

const RESOURCE_TYPES = [
  'project', 'object', 'object_group', 'checklist', 'checklist_run',
  'task', 'evidence', 'incident', 'report', 'audit_log',
  'referentiel', 'framework_control', 'cartography_asset',
  'cartography_relation', 'integration', 'user',
];

const ACTIONS = ['read', 'create', 'update', 'delete', 'export', 'manage'];

@Component({
  selector: 'app-roles-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-white">Role Management</h1>
          <p class="text-sm text-zinc-400 mt-1">Configure roles and their permissions
            <a routerLink="/app/docs/module-admin"
               class="inline-flex items-center gap-1 ml-3 text-zinc-600 hover:text-emerald-400 transition-colors">
              <iconify-icon icon="solar:book-2-linear" width="12"></iconify-icon>
              <span class="text-[10px]">Guide</span>
            </a>
          </p>
        </div>
        <button *ngIf="perm.canGlobal('user', 'manage')" (click)="openCreateModal()"
          class="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2">
          <iconify-icon icon="solar:add-circle-linear" width="18"></iconify-icon>
          New Role
        </button>
      </div>

      <!-- Roles Cards -->
      <div class="grid gap-4">
        <div *ngFor="let role of roles"
          class="bg-zinc-900/50 border border-white/10 rounded-xl p-5">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-sm font-semibold text-white flex items-center gap-2">
                {{ role.name }}
                <span *ngIf="role.isSystem" class="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400 uppercase">system</span>
              </h3>
              <p class="text-xs text-zinc-500 mt-0.5">{{ role.description || 'No description' }}</p>
            </div>
            <div class="flex gap-2">
              <button *ngIf="perm.canGlobal('user', 'manage')" (click)="openEditModal(role)"
                class="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors">
                <iconify-icon icon="solar:pen-linear" width="16"></iconify-icon>
              </button>
              <button *ngIf="!role.isSystem && perm.canGlobal('user', 'manage')" (click)="deleteRole(role)"
                class="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors">
                <iconify-icon icon="solar:trash-bin-trash-linear" width="16"></iconify-icon>
              </button>
            </div>
          </div>

          <!-- Permissions summary -->
          <div class="flex flex-wrap gap-1">
            <span *ngFor="let perm of role.permissions"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300">
              <span class="text-zinc-500">{{ perm.resourceType }}:</span>
              {{ perm.actions.join(', ') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div *ngIf="showModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" (click)="closeModal()">
        <div class="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <h2 class="text-lg font-semibold text-white mb-4">
            {{ editingRole ? 'Edit Role' : 'Create Role' }}
          </h2>

          <div class="space-y-4 mb-6">
            <div>
              <label class="block text-xs text-zinc-400 mb-1">Name</label>
              <input [(ngModel)]="formName" type="text"
                class="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50" />
            </div>
            <div *ngIf="!editingRole">
              <label class="block text-xs text-zinc-400 mb-1">Slug</label>
              <input [(ngModel)]="formSlug" type="text"
                class="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50" />
            </div>
            <div>
              <label class="block text-xs text-zinc-400 mb-1">Description</label>
              <input [(ngModel)]="formDescription" type="text"
                class="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50" />
            </div>

            <!-- Permissions Matrix -->
            <div>
              <label class="block text-xs text-zinc-400 mb-2">Permissions</label>
              <div class="overflow-x-auto">
                <table class="w-full text-xs">
                  <thead>
                    <tr>
                      <th class="text-left px-2 py-1 text-zinc-500">Resource</th>
                      <th *ngFor="let action of allActions" class="px-2 py-1 text-zinc-500 text-center">{{ action }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let rt of allResourceTypes" class="border-t border-white/5">
                      <td class="px-2 py-1 text-zinc-300">{{ rt }}</td>
                      <td *ngFor="let action of allActions" class="px-2 py-1 text-center">
                        <input type="checkbox"
                          [checked]="hasPermission(rt, action)"
                          (change)="togglePermission(rt, action)"
                          class="w-3.5 h-3.5 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="flex gap-3 justify-end">
            <button (click)="closeModal()" class="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
              Cancel
            </button>
            <button (click)="saveRole()" class="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors">
              {{ editingRole ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RolesAdminComponent implements OnInit {
  roles: any[] = [];
  showModal = false;
  editingRole: any = null;

  formName = '';
  formSlug = '';
  formDescription = '';
  formPermissions = new Map<string, Set<string>>();

  allResourceTypes = RESOURCE_TYPES;
  allActions = ACTIONS;

  constructor(private api: ApiService, public perm: PermissionService) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.api.getRoles().subscribe((roles) => {
      this.roles = roles;
    });
  }

  openCreateModal(): void {
    this.editingRole = null;
    this.formName = '';
    this.formSlug = '';
    this.formDescription = '';
    this.formPermissions = new Map();
    this.showModal = true;
  }

  openEditModal(role: any): void {
    this.editingRole = role;
    this.formName = role.name;
    this.formSlug = role.slug;
    this.formDescription = role.description || '';
    this.formPermissions = new Map();
    for (const perm of role.permissions || []) {
      this.formPermissions.set(perm.resourceType, new Set(perm.actions));
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingRole = null;
  }

  hasPermission(resourceType: string, action: string): boolean {
    return this.formPermissions.get(resourceType)?.has(action) ?? false;
  }

  togglePermission(resourceType: string, action: string): void {
    if (!this.formPermissions.has(resourceType)) {
      this.formPermissions.set(resourceType, new Set());
    }
    const actions = this.formPermissions.get(resourceType)!;
    if (actions.has(action)) {
      actions.delete(action);
      if (actions.size === 0) {
        this.formPermissions.delete(resourceType);
      }
    } else {
      actions.add(action);
    }
  }

  saveRole(): void {
    const permissions = Array.from(this.formPermissions.entries()).map(
      ([resourceType, actions]) => ({
        resourceType,
        actions: Array.from(actions),
      }),
    );

    if (this.editingRole) {
      this.api
        .updateRole(this.editingRole.id, {
          name: this.formName,
          description: this.formDescription,
          permissions,
        })
        .subscribe(() => {
          this.closeModal();
          this.loadRoles();
        });
    } else {
      this.api
        .createRole({
          name: this.formName,
          slug: this.formSlug,
          description: this.formDescription,
          permissions,
        })
        .subscribe(() => {
          this.closeModal();
          this.loadRoles();
        });
    }
  }

  deleteRole(role: any): void {
    if (confirm(`Delete role "${role.name}"? This cannot be undone.`)) {
      this.api.deleteRole(role.id).subscribe(() => {
        this.loadRoles();
      });
    }
  }
}
