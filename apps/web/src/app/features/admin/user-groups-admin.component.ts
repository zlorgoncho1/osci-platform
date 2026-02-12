import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-user-groups-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-white">User Groups</h1>
          <p class="text-sm text-zinc-400 mt-1">Manage groups, members, roles and permissions</p>
        </div>
        <button
          *ngIf="permissionService.canGlobal('user_group', 'create')"
          (click)="openGroupModal()"
          class="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2">
          <iconify-icon icon="solar:add-circle-bold" width="16"></iconify-icon>
          New Group
        </button>
      </div>

      <!-- Groups List -->
      <div *ngIf="!selectedGroup" class="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-white/10">
              <th class="text-left px-4 py-3 text-zinc-400 font-medium">Name</th>
              <th class="text-left px-4 py-3 text-zinc-400 font-medium">Slug</th>
              <th class="text-left px-4 py-3 text-zinc-400 font-medium">Members</th>
              <th class="text-left px-4 py-3 text-zinc-400 font-medium">Description</th>
              <th class="text-right px-4 py-3 text-zinc-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let group of groups" class="border-b border-white/5 hover:bg-white/[0.02]">
              <td class="px-4 py-3">
                <button (click)="selectGroup(group)" class="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
                  {{ group.name }}
                </button>
              </td>
              <td class="px-4 py-3 text-zinc-400 font-mono text-xs">{{ group.slug }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-zinc-700/50 text-zinc-300">
                  {{ group.members?.length || 0 }}
                </span>
              </td>
              <td class="px-4 py-3 text-zinc-400 text-xs truncate max-w-xs">{{ group.description || '—' }}</td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button
                    *ngIf="permissionService.canGlobal('user_group', 'update')"
                    (click)="openGroupModal(group)"
                    class="px-2 py-1 text-xs bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 transition-colors"
                    title="Edit">
                    <iconify-icon icon="solar:pen-bold" width="14"></iconify-icon>
                  </button>
                  <button
                    *ngIf="permissionService.canGlobal('user_group', 'delete')"
                    (click)="confirmDelete(group)"
                    class="px-2 py-1 text-xs bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors"
                    title="Delete">
                    <iconify-icon icon="solar:trash-bin-trash-bold" width="14"></iconify-icon>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="groups.length === 0">
              <td colspan="5" class="px-4 py-8 text-center text-zinc-500">No groups created yet</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Group Detail View -->
      <div *ngIf="selectedGroup" class="space-y-6">
        <div class="flex items-center gap-3">
          <button (click)="selectedGroup = null; loadGroups()"
            class="p-2 rounded-lg hover:bg-white/5 transition-colors text-zinc-400">
            <iconify-icon icon="solar:arrow-left-linear" width="20"></iconify-icon>
          </button>
          <div>
            <h2 class="text-lg font-semibold text-white">{{ selectedGroup.name }}</h2>
            <p class="text-xs text-zinc-500 font-mono">{{ selectedGroup.slug }}</p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 border-b border-white/10">
          <button *ngFor="let tab of ['Members', 'Roles', 'Permissions']"
            (click)="activeTab = tab"
            class="px-4 py-2 text-sm transition-colors border-b-2"
            [class]="activeTab === tab ? 'text-emerald-400 border-emerald-400' : 'text-zinc-400 border-transparent hover:text-zinc-200'">
            {{ tab }}
          </button>
        </div>

        <!-- Members Tab -->
        <div *ngIf="activeTab === 'Members'" class="space-y-4">
          <div class="flex items-center gap-2">
            <select [(ngModel)]="addMemberUserId"
              class="flex-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50">
              <option value="">Select user to add...</option>
              <option *ngFor="let u of availableUsers" [value]="u.id">{{ u.email }} ({{ u.firstName || 'N/A' }})</option>
            </select>
            <button (click)="addMember()" [disabled]="!addMemberUserId"
              class="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Add
            </button>
          </div>

          <div class="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-white/10">
                  <th class="text-left px-4 py-3 text-zinc-400 font-medium">User</th>
                  <th class="text-left px-4 py-3 text-zinc-400 font-medium">Email</th>
                  <th class="text-right px-4 py-3 text-zinc-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let member of groupMembers" class="border-b border-white/5 hover:bg-white/[0.02]">
                  <td class="px-4 py-3 text-zinc-200">{{ member.firstName || '' }} {{ member.lastName || '' }}</td>
                  <td class="px-4 py-3 text-zinc-300">{{ member.email }}</td>
                  <td class="px-4 py-3 text-right">
                    <button (click)="removeMember(member)"
                      class="px-2 py-1 text-xs bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors"
                      title="Remove">
                      <iconify-icon icon="solar:close-circle-bold" width="14"></iconify-icon>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="groupMembers.length === 0">
                  <td colspan="3" class="px-4 py-6 text-center text-zinc-500">No members</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Roles Tab -->
        <div *ngIf="activeTab === 'Roles'" class="space-y-4">
          <div class="bg-zinc-900/50 border border-white/10 rounded-xl p-4 space-y-2">
            <label *ngFor="let role of allRoles" class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
              <input
                type="checkbox"
                [checked]="selectedGroupRoleIds.has(role.id)"
                (change)="toggleGroupRole(role.id)"
                class="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500/30" />
              <div>
                <span class="text-sm text-zinc-200">{{ role.name }}</span>
                <span *ngIf="role.isSystem" class="ml-2 text-[10px] text-zinc-500 uppercase">system</span>
                <p *ngIf="role.description" class="text-xs text-zinc-500">{{ role.description }}</p>
              </div>
            </label>
          </div>
          <div class="flex justify-end">
            <button (click)="saveGroupRoles()"
              class="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors">
              Save Roles
            </button>
          </div>
        </div>

        <!-- Permissions Tab -->
        <div *ngIf="activeTab === 'Permissions'" class="space-y-4">
          <div class="bg-zinc-900/50 border border-white/10 rounded-xl p-4 space-y-3">
            <div *ngFor="let perm of groupPermissionEntries; let i = index" class="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/50">
              <select [(ngModel)]="perm.resourceType"
                class="px-3 py-1.5 bg-zinc-800 border border-white/10 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50">
                <option *ngFor="let rt of resourceTypes" [value]="rt">{{ rt }}</option>
              </select>
              <div class="flex flex-wrap gap-1 flex-1">
                <label *ngFor="let act of allActions" class="flex items-center gap-1.5 text-xs">
                  <input type="checkbox"
                    [checked]="perm.actions.includes(act)"
                    (change)="togglePermAction(perm, act)"
                    class="w-3.5 h-3.5 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500/30" />
                  <span class="text-zinc-300">{{ act }}</span>
                </label>
              </div>
              <button (click)="removePermEntry(i)"
                class="p-1 text-red-400 hover:text-red-300 transition-colors" title="Remove">
                <iconify-icon icon="solar:close-circle-bold" width="16"></iconify-icon>
              </button>
            </div>
            <button (click)="addPermEntry()"
              class="text-sm text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
              <iconify-icon icon="solar:add-circle-linear" width="16"></iconify-icon>
              Add Permission
            </button>
          </div>
          <div class="flex justify-end">
            <button (click)="saveGroupPermissions()"
              class="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors">
              Save Permissions
            </button>
          </div>
        </div>
      </div>

      <!-- Create/Edit Group Modal -->
      <div *ngIf="groupModalOpen" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" (click)="closeGroupModal()">
        <div class="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-md" (click)="$event.stopPropagation()">
          <h2 class="text-lg font-semibold text-white mb-4">
            {{ groupForm.id ? 'Edit Group' : 'New Group' }}
          </h2>

          <div class="space-y-4 mb-6">
            <div>
              <label class="block text-sm text-zinc-400 mb-1">Name *</label>
              <input type="text" [(ngModel)]="groupForm.name"
                (ngModelChange)="autoSlug()"
                class="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50"
                placeholder="Engineering Team" />
            </div>
            <div>
              <label class="block text-sm text-zinc-400 mb-1">Slug *</label>
              <input type="text" [(ngModel)]="groupForm.slug"
                class="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-zinc-200 text-sm font-mono focus:outline-none focus:border-emerald-500/50"
                placeholder="engineering-team" />
            </div>
            <div>
              <label class="block text-sm text-zinc-400 mb-1">Description</label>
              <textarea [(ngModel)]="groupForm.description" rows="2"
                class="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50"
                placeholder="Optional description..."></textarea>
            </div>
          </div>

          <p *ngIf="groupFormError" class="text-sm text-red-400 mb-4">{{ groupFormError }}</p>

          <div class="flex gap-3 justify-end">
            <button (click)="closeGroupModal()" class="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
              Cancel
            </button>
            <button
              (click)="saveGroup()"
              [disabled]="!groupForm.name || !groupForm.slug"
              class="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {{ groupForm.id ? 'Save' : 'Create' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div *ngIf="deletingGroup" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" (click)="deletingGroup = null">
        <div class="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-sm" (click)="$event.stopPropagation()">
          <h2 class="text-lg font-semibold text-white mb-2">Delete Group</h2>
          <p class="text-sm text-zinc-400 mb-6">
            Are you sure you want to delete <span class="text-zinc-200">{{ deletingGroup.name }}</span>? Members will lose group-inherited permissions.
          </p>
          <div class="flex gap-3 justify-end">
            <button (click)="deletingGroup = null" class="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
              Cancel
            </button>
            <button (click)="deleteGroup()" class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class UserGroupsAdminComponent implements OnInit {
  groups: any[] = [];
  allRoles: any[] = [];
  allUsers: any[] = [];

  // Group detail
  selectedGroup: any = null;
  activeTab = 'Members';
  groupMembers: any[] = [];
  addMemberUserId = '';
  selectedGroupRoleIds = new Set<string>();
  groupPermissionEntries: { resourceType: string; actions: string[] }[] = [];

  // Create/Edit modal
  groupModalOpen = false;
  groupForm: { id?: string; name: string; slug: string; description: string } = {
    name: '',
    slug: '',
    description: '',
  };
  groupFormError = '';

  // Delete confirmation
  deletingGroup: any = null;

  // Enum values for permission editor
  resourceTypes = [
    'project', 'object', 'object_group', 'checklist', 'checklist_run',
    'task', 'evidence', 'incident', 'report', 'audit_log', 'referentiel',
    'framework_control', 'cartography_asset', 'cartography_relation',
    'integration', 'user', 'user_group',
  ];
  allActions = ['read', 'create', 'update', 'delete', 'export', 'manage'];

  constructor(
    private api: ApiService,
    public permissionService: PermissionService,
  ) {}

  ngOnInit(): void {
    this.loadGroups();
    this.api.getRoles().subscribe((roles) => (this.allRoles = roles));
    this.api.getUsers().subscribe((users) => (this.allUsers = users));
  }

  loadGroups(): void {
    this.api.getUserGroups().subscribe((groups) => (this.groups = groups));
  }

  get availableUsers(): any[] {
    const memberIds = new Set(this.groupMembers.map((m: any) => m.id));
    return this.allUsers.filter((u) => !memberIds.has(u.id));
  }

  // --- Group Detail ---

  selectGroup(group: any): void {
    this.api.getUserGroup(group.id).subscribe((detail) => {
      this.selectedGroup = detail;
      this.activeTab = 'Members';
      this.loadGroupMembers();
      this.loadGroupRoles();
      this.loadGroupPermissions();
    });
  }

  private loadGroupMembers(): void {
    this.api.getGroupMembers(this.selectedGroup.id).subscribe((members) => {
      this.groupMembers = members;
    });
  }

  private loadGroupRoles(): void {
    this.api.getGroupRoles(this.selectedGroup.id).subscribe((roles) => {
      this.selectedGroupRoleIds = new Set(roles.map((r: any) => r.id));
    });
  }

  private loadGroupPermissions(): void {
    this.api.getGroupPermissions(this.selectedGroup.id).subscribe((perms) => {
      this.groupPermissionEntries = perms.map((p: any) => ({
        resourceType: p.resourceType,
        actions: Array.isArray(p.actions) ? [...p.actions] : (p.actions || '').split(',').filter(Boolean),
      }));
    });
  }

  // --- Members ---

  addMember(): void {
    if (!this.addMemberUserId || !this.selectedGroup) return;
    this.api.addUserGroupMembers(this.selectedGroup.id, [this.addMemberUserId]).subscribe({
      next: () => {
        this.addMemberUserId = '';
        this.loadGroupMembers();
      },
      error: (err) => alert(err.error?.message || 'Failed to add member'),
    });
  }

  removeMember(member: any): void {
    if (!this.selectedGroup) return;
    this.api.removeUserGroupMember(this.selectedGroup.id, member.id).subscribe({
      next: () => this.loadGroupMembers(),
      error: (err) => alert(err.error?.message || 'Failed to remove member'),
    });
  }

  // --- Roles ---

  toggleGroupRole(roleId: string): void {
    if (this.selectedGroupRoleIds.has(roleId)) {
      this.selectedGroupRoleIds.delete(roleId);
    } else {
      this.selectedGroupRoleIds.add(roleId);
    }
  }

  saveGroupRoles(): void {
    if (!this.selectedGroup) return;
    const roleIds = Array.from(this.selectedGroupRoleIds);
    this.api.setGroupRoles(this.selectedGroup.id, roleIds).subscribe({
      next: () => this.loadGroupRoles(),
      error: (err) => alert(err.error?.message || 'Failed to save roles'),
    });
  }

  // --- Permissions ---

  addPermEntry(): void {
    this.groupPermissionEntries.push({ resourceType: this.resourceTypes[0], actions: ['read'] });
  }

  removePermEntry(index: number): void {
    this.groupPermissionEntries.splice(index, 1);
  }

  togglePermAction(perm: { actions: string[] }, action: string): void {
    const idx = perm.actions.indexOf(action);
    if (idx >= 0) {
      perm.actions.splice(idx, 1);
    } else {
      perm.actions.push(action);
    }
  }

  saveGroupPermissions(): void {
    if (!this.selectedGroup) return;
    const perms = this.groupPermissionEntries.filter((p) => p.actions.length > 0);
    this.api.setGroupPermissions(this.selectedGroup.id, perms).subscribe({
      next: () => this.loadGroupPermissions(),
      error: (err) => alert(err.error?.message || 'Failed to save permissions'),
    });
  }

  // --- Create/Edit Group ---

  openGroupModal(group?: any): void {
    this.groupFormError = '';
    if (group) {
      this.groupForm = {
        id: group.id,
        name: group.name,
        slug: group.slug,
        description: group.description || '',
      };
    } else {
      this.groupForm = { name: '', slug: '', description: '' };
    }
    this.groupModalOpen = true;
  }

  closeGroupModal(): void {
    this.groupModalOpen = false;
    this.groupFormError = '';
  }

  autoSlug(): void {
    if (!this.groupForm.id) {
      this.groupForm.slug = this.groupForm.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
  }

  saveGroup(): void {
    this.groupFormError = '';
    if (this.groupForm.id) {
      this.api.updateUserGroup(this.groupForm.id, {
        name: this.groupForm.name,
        slug: this.groupForm.slug,
        description: this.groupForm.description || undefined,
      }).subscribe({
        next: () => {
          this.closeGroupModal();
          this.loadGroups();
          if (this.selectedGroup?.id === this.groupForm.id) {
            this.selectGroup({ id: this.groupForm.id });
          }
        },
        error: (err) => {
          this.groupFormError = err.error?.message || 'Failed to update group';
        },
      });
    } else {
      this.api.createUserGroup({
        name: this.groupForm.name,
        slug: this.groupForm.slug,
        description: this.groupForm.description || undefined,
      }).subscribe({
        next: () => {
          this.closeGroupModal();
          this.loadGroups();
        },
        error: (err) => {
          this.groupFormError = err.error?.message || 'Failed to create group';
        },
      });
    }
  }

  // --- Delete ---

  confirmDelete(group: any): void {
    this.deletingGroup = group;
  }

  deleteGroup(): void {
    if (!this.deletingGroup) return;
    const deletedId = this.deletingGroup.id;
    this.api.deleteUserGroup(deletedId).subscribe({
      next: () => {
        if (this.selectedGroup?.id === deletedId) {
          this.selectedGroup = null;
        }
        this.deletingGroup = null;
        this.loadGroups();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to delete group');
        this.deletingGroup = null;
      },
    });
  }
}
