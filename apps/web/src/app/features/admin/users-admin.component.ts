import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-users-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-white">User Management</h1>
          <p class="text-sm text-zinc-400 mt-1">Manage user roles, access and Keycloak sync</p>
        </div>
        <div class="flex gap-2">
          <button
            *ngIf="permissionService.isAdmin"
            (click)="openMergeModal()"
            class="px-4 py-2 text-sm bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-colors flex items-center gap-2">
            <iconify-icon icon="solar:users-group-two-rounded-bold" width="16"></iconify-icon>
            Merge Users
          </button>
          <button
            *ngIf="permissionService.canGlobal('user', 'create')"
            (click)="openUserModal()"
            class="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2">
            <iconify-icon icon="solar:user-plus-bold" width="16"></iconify-icon>
            New User
          </button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-white/10">
              <th class="text-left px-4 py-3 text-zinc-400 font-medium">User</th>
              <th class="text-left px-4 py-3 text-zinc-400 font-medium">Email</th>
              <th class="text-left px-4 py-3 text-zinc-400 font-medium">Status</th>
              <th class="text-left px-4 py-3 text-zinc-400 font-medium">Roles</th>
              <th class="text-left px-4 py-3 text-zinc-400 font-medium">Last Login</th>
              <th class="text-right px-4 py-3 text-zinc-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users" class="border-b border-white/5 hover:bg-white/[0.02]">
              <td class="px-4 py-3 text-zinc-200">
                {{ user.firstName || '' }} {{ user.lastName || '' }}
                <span *ngIf="!user.firstName && !user.lastName" class="text-zinc-500">N/A</span>
              </td>
              <td class="px-4 py-3 text-zinc-300">{{ user.email }}</td>
              <td class="px-4 py-3">
                <span *ngIf="user.enabled === false"
                  class="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-red-500/20 text-red-400">
                  Disabled
                </span>
                <span *ngIf="user.enabled !== false && user.keycloakId"
                  class="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-500/20 text-emerald-400">
                  Active
                </span>
                <span *ngIf="user.enabled !== false && !user.keycloakId"
                  class="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-500/20 text-amber-400">
                  Pending
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <span *ngFor="let role of getUserRolesDisplay(user.id)"
                    class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                    [class]="getRoleBadgeClass(role)">
                    {{ role }}
                  </span>
                  <span *ngIf="getUserRolesDisplay(user.id).length === 0" class="text-zinc-500 text-xs">No roles</span>
                </div>
              </td>
              <td class="px-4 py-3 text-zinc-400 text-xs">
                {{ user.lastLoginAt ? (user.lastLoginAt | date:'short') : 'Never' }}
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button
                    *ngIf="permissionService.canGlobal('user', 'update')"
                    (click)="openUserModal(user)"
                    class="px-2 py-1 text-xs bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 transition-colors"
                    title="Edit">
                    <iconify-icon icon="solar:pen-bold" width="14"></iconify-icon>
                  </button>
                  <button
                    *ngIf="permissionService.isAdmin"
                    (click)="openRoleEditor(user)"
                    class="px-2 py-1 text-xs bg-emerald-600/20 text-emerald-400 rounded hover:bg-emerald-600/30 transition-colors"
                    title="Edit Roles">
                    <iconify-icon icon="solar:shield-user-bold" width="14"></iconify-icon>
                  </button>
                  <button
                    *ngIf="permissionService.isAdmin"
                    (click)="resetPassword(user)"
                    class="px-2 py-1 text-xs bg-amber-600/20 text-amber-400 rounded hover:bg-amber-600/30 transition-colors"
                    title="Reset Password">
                    <iconify-icon icon="solar:key-bold" width="14"></iconify-icon>
                  </button>
                  <button
                    *ngIf="permissionService.isAdmin"
                    (click)="toggleEnabled(user)"
                    class="px-2 py-1 text-xs rounded transition-colors"
                    [class]="user.enabled !== false ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'"
                    [title]="user.enabled !== false ? 'Disable' : 'Enable'">
                    <iconify-icon [icon]="user.enabled !== false ? 'solar:lock-bold' : 'solar:lock-unlocked-bold'" width="14"></iconify-icon>
                  </button>
                  <!-- Keycloak actions menu -->
                  <div *ngIf="permissionService.isAdmin && user.keycloakId" class="relative">
                    <button
                      (click)="toggleKcMenu(user.id)"
                      class="px-2 py-1 text-xs bg-zinc-700/50 text-zinc-300 rounded hover:bg-zinc-700 transition-colors"
                      title="Keycloak Actions">
                      <iconify-icon icon="solar:menu-dots-bold" width="14"></iconify-icon>
                    </button>
                    <div *ngIf="kcMenuOpen === user.id"
                      class="absolute right-0 top-full mt-1 bg-zinc-800 border border-white/10 rounded-lg shadow-xl z-10 py-1 min-w-[160px]">
                      <button (click)="forceTotp(user); kcMenuOpen = null"
                        class="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5 flex items-center gap-2">
                        <iconify-icon icon="solar:smartphone-bold" width="14"></iconify-icon>
                        Force TOTP
                      </button>
                      <button (click)="verifyEmail(user); kcMenuOpen = null"
                        class="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5 flex items-center gap-2">
                        <iconify-icon icon="solar:letter-bold" width="14"></iconify-icon>
                        Verify Email
                      </button>
                      <button (click)="forcePasswordChange(user); kcMenuOpen = null"
                        class="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5 flex items-center gap-2">
                        <iconify-icon icon="solar:lock-password-bold" width="14"></iconify-icon>
                        Force Password Change
                      </button>
                    </div>
                  </div>
                  <button
                    *ngIf="permissionService.canGlobal('user', 'delete')"
                    (click)="confirmDelete(user)"
                    class="px-2 py-1 text-xs bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors"
                    title="Delete">
                    <iconify-icon icon="solar:trash-bin-trash-bold" width="14"></iconify-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Create/Edit User Modal -->
      <div *ngIf="userModalOpen" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" (click)="closeUserModal()">
        <div class="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-md" (click)="$event.stopPropagation()">
          <h2 class="text-lg font-semibold text-white mb-4">
            {{ userForm.id ? 'Edit User' : 'New User' }}
          </h2>

          <div class="space-y-4 mb-6">
            <div>
              <label class="block text-sm text-zinc-400 mb-1">Email *</label>
              <input
                type="email"
                [(ngModel)]="userForm.email"
                class="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50"
                placeholder="user@example.com" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-zinc-400 mb-1">First Name</label>
                <input
                  type="text"
                  [(ngModel)]="userForm.firstName"
                  class="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50"
                  placeholder="John" />
              </div>
              <div>
                <label class="block text-sm text-zinc-400 mb-1">Last Name</label>
                <input
                  type="text"
                  [(ngModel)]="userForm.lastName"
                  class="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50"
                  placeholder="Doe" />
              </div>
            </div>

            <!-- Temporary password (create only) -->
            <div *ngIf="!userForm.id">
              <label class="block text-sm text-zinc-400 mb-1">Temporary Password *</label>
              <div class="flex gap-2">
                <input
                  type="text"
                  [(ngModel)]="userForm.temporaryPassword"
                  class="flex-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-zinc-200 text-sm font-mono focus:outline-none focus:border-emerald-500/50"
                  placeholder="Min. 8 characters" />
                <button (click)="generatePassword()"
                  class="px-3 py-2 text-xs bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 transition-colors"
                  title="Generate">
                  <iconify-icon icon="solar:refresh-bold" width="14"></iconify-icon>
                </button>
              </div>
            </div>

            <!-- Role selection (create only) -->
            <div *ngIf="!userForm.id">
              <label class="block text-sm text-zinc-400 mb-2">Initial Roles</label>
              <div class="space-y-1 max-h-40 overflow-y-auto">
                <label *ngFor="let role of allRoles" class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    [checked]="userFormRoleIds.has(role.id)"
                    (change)="toggleUserFormRole(role.id)"
                    class="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500/30" />
                  <span class="text-sm text-zinc-200">{{ role.name }}</span>
                </label>
              </div>
            </div>
          </div>

          <p *ngIf="userFormError" class="text-sm text-red-400 mb-4">{{ userFormError }}</p>

          <div class="flex gap-3 justify-end">
            <button (click)="closeUserModal()" class="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
              Cancel
            </button>
            <button
              (click)="saveUser()"
              [disabled]="!userForm.email || (!userForm.id && !userForm.temporaryPassword)"
              class="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {{ userForm.id ? 'Save' : 'Create' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Temp Password Result Modal -->
      <div *ngIf="tempPasswordResult" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" (click)="tempPasswordResult = null">
        <div class="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-sm" (click)="$event.stopPropagation()">
          <h2 class="text-lg font-semibold text-white mb-2">Temporary Password</h2>
          <p class="text-sm text-zinc-400 mb-4">This password will only be shown once. The user must change it on first login.</p>
          <div class="bg-zinc-800 border border-white/10 rounded-lg p-3 font-mono text-sm text-emerald-400 select-all text-center mb-4">
            {{ tempPasswordResult }}
          </div>
          <div class="flex justify-end">
            <button (click)="tempPasswordResult = null" class="px-4 py-2 text-sm bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600 transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div *ngIf="deletingUser" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" (click)="deletingUser = null">
        <div class="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-sm" (click)="$event.stopPropagation()">
          <h2 class="text-lg font-semibold text-white mb-2">Delete User</h2>
          <p class="text-sm text-zinc-400 mb-6">
            Are you sure you want to delete <span class="text-zinc-200">{{ deletingUser.email }}</span>? This action cannot be undone.
          </p>
          <div class="flex gap-3 justify-end">
            <button (click)="deletingUser = null" class="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
              Cancel
            </button>
            <button (click)="deleteUser()" class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Role Editor Modal -->
      <div *ngIf="editingUser" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" (click)="closeRoleEditor()">
        <div class="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-md" (click)="$event.stopPropagation()">
          <h2 class="text-lg font-semibold text-white mb-4">
            Edit Roles for {{ editingUser.firstName || editingUser.email }}
          </h2>

          <div class="space-y-2 mb-6">
            <label *ngFor="let role of allRoles" class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
              <input
                type="checkbox"
                [checked]="selectedRoleIds.has(role.id)"
                (change)="toggleRole(role.id)"
                class="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500/30" />
              <div>
                <span class="text-sm text-zinc-200">{{ role.name }}</span>
                <span *ngIf="role.isSystem" class="ml-2 text-[10px] text-zinc-500 uppercase">system</span>
                <p *ngIf="role.description" class="text-xs text-zinc-500">{{ role.description }}</p>
              </div>
            </label>
          </div>

          <div class="flex gap-3 justify-end">
            <button (click)="closeRoleEditor()" class="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
              Cancel
            </button>
            <button (click)="saveRoles()" class="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors">
              Save Roles
            </button>
          </div>
        </div>
      </div>

      <!-- Merge Users Modal -->
      <div *ngIf="mergeModalOpen" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" (click)="mergeModalOpen = false">
        <div class="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-md" (click)="$event.stopPropagation()">
          <h2 class="text-lg font-semibold text-white mb-2">Merge Users</h2>
          <p class="text-sm text-zinc-400 mb-4">
            Select the user to keep and the user to remove. All roles, access and references will be transferred.
          </p>

          <div class="space-y-4 mb-6">
            <div>
              <label class="block text-sm text-zinc-400 mb-1">Keep (target)</label>
              <select [(ngModel)]="mergeKeepId"
                class="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50">
                <option value="">Select user to keep...</option>
                <option *ngFor="let u of users" [value]="u.id">{{ u.email }} ({{ u.firstName || 'N/A' }})</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-zinc-400 mb-1">Remove (merge into target)</label>
              <select [(ngModel)]="mergeRemoveId"
                class="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50">
                <option value="">Select user to remove...</option>
                <option *ngFor="let u of users" [value]="u.id" [disabled]="u.id === mergeKeepId">{{ u.email }} ({{ u.firstName || 'N/A' }})</option>
              </select>
            </div>
          </div>

          <p *ngIf="mergeError" class="text-sm text-red-400 mb-4">{{ mergeError }}</p>

          <div class="flex gap-3 justify-end">
            <button (click)="mergeModalOpen = false" class="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
              Cancel
            </button>
            <button
              (click)="executeMerge()"
              [disabled]="!mergeKeepId || !mergeRemoveId || mergeKeepId === mergeRemoveId"
              class="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Merge
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class UsersAdminComponent implements OnInit {
  users: any[] = [];
  allRoles: any[] = [];
  userRolesMap = new Map<string, any[]>();

  // Role editor
  editingUser: any = null;
  selectedRoleIds = new Set<string>();

  // User create/edit modal
  userModalOpen = false;
  userForm: { id?: string; email: string; firstName: string; lastName: string; temporaryPassword: string } = {
    email: '',
    firstName: '',
    lastName: '',
    temporaryPassword: '',
  };
  userFormRoleIds = new Set<string>();
  userFormError = '';

  // Temp password result
  tempPasswordResult: string | null = null;

  // Delete confirmation
  deletingUser: any = null;

  // KC menu
  kcMenuOpen: string | null = null;

  // Merge
  mergeModalOpen = false;
  mergeKeepId = '';
  mergeRemoveId = '';
  mergeError = '';

  constructor(
    private api: ApiService,
    public permissionService: PermissionService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.getUsers().subscribe((users) => {
      this.users = users;
      for (const user of users) {
        this.api.getUserRoles(user.id).subscribe((roles) => {
          this.userRolesMap.set(user.id, roles);
        });
      }
    });
    this.api.getRoles().subscribe((roles) => {
      this.allRoles = roles;
    });
  }

  getUserRolesDisplay(userId: string): string[] {
    return (this.userRolesMap.get(userId) || []).map((r: any) => r.name);
  }

  getRoleBadgeClass(role: string): string {
    if (role.includes('Admin')) return 'bg-red-500/20 text-red-400';
    if (role.includes('Manager')) return 'bg-blue-500/20 text-blue-400';
    if (role.includes('Owner')) return 'bg-purple-500/20 text-purple-400';
    if (role.includes('Auditor')) return 'bg-amber-500/20 text-amber-400';
    return 'bg-zinc-700/50 text-zinc-300';
  }

  // --- User Create/Edit ---

  openUserModal(user?: any): void {
    this.userFormError = '';
    this.userFormRoleIds = new Set<string>();
    if (user) {
      this.userForm = {
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        temporaryPassword: '',
      };
    } else {
      this.userForm = { email: '', firstName: '', lastName: '', temporaryPassword: '' };
      this.generatePassword();
    }
    this.userModalOpen = true;
  }

  closeUserModal(): void {
    this.userModalOpen = false;
    this.userFormError = '';
  }

  generatePassword(): void {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 16; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.userForm.temporaryPassword = pwd;
  }

  toggleUserFormRole(roleId: string): void {
    if (this.userFormRoleIds.has(roleId)) {
      this.userFormRoleIds.delete(roleId);
    } else {
      this.userFormRoleIds.add(roleId);
    }
  }

  saveUser(): void {
    this.userFormError = '';
    if (this.userForm.id) {
      // Update
      const data: any = {};
      if (this.userForm.email) data.email = this.userForm.email;
      if (this.userForm.firstName) data.firstName = this.userForm.firstName;
      if (this.userForm.lastName) data.lastName = this.userForm.lastName;
      this.api.updateUser(this.userForm.id, data).subscribe({
        next: () => {
          this.closeUserModal();
          this.loadData();
        },
        error: (err) => {
          this.userFormError = err.error?.message || 'Failed to update user';
        },
      });
    } else {
      // Create
      const data: any = {
        email: this.userForm.email,
        firstName: this.userForm.firstName || undefined,
        lastName: this.userForm.lastName || undefined,
        temporaryPassword: this.userForm.temporaryPassword,
      };
      const roleIds = Array.from(this.userFormRoleIds);
      if (roleIds.length) data.roleIds = roleIds;
      this.api.createUser(data).subscribe({
        next: (result) => {
          this.closeUserModal();
          if (result.temporaryPassword) {
            this.tempPasswordResult = result.temporaryPassword;
          }
          this.loadData();
        },
        error: (err) => {
          this.userFormError = err.error?.message || 'Failed to create user';
        },
      });
    }
  }

  // --- Delete ---

  confirmDelete(user: any): void {
    this.deletingUser = user;
  }

  deleteUser(): void {
    if (!this.deletingUser) return;
    this.api.deleteUser(this.deletingUser.id).subscribe({
      next: () => {
        this.deletingUser = null;
        this.loadData();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to delete user');
        this.deletingUser = null;
      },
    });
  }

  // --- Role Editor ---

  openRoleEditor(user: any): void {
    this.editingUser = user;
    const currentRoles = this.userRolesMap.get(user.id) || [];
    this.selectedRoleIds = new Set(currentRoles.map((r: any) => r.id));
  }

  closeRoleEditor(): void {
    this.editingUser = null;
    this.selectedRoleIds.clear();
  }

  toggleRole(roleId: string): void {
    if (this.selectedRoleIds.has(roleId)) {
      this.selectedRoleIds.delete(roleId);
    } else {
      this.selectedRoleIds.add(roleId);
    }
  }

  saveRoles(): void {
    if (!this.editingUser) return;
    const roleIds = Array.from(this.selectedRoleIds);
    this.api.setUserRoles(this.editingUser.id, roleIds).subscribe((roles) => {
      this.userRolesMap.set(this.editingUser.id, roles);
      this.closeRoleEditor();
    });
  }

  // --- Keycloak Admin Actions ---

  resetPassword(user: any): void {
    this.api.resetUserPassword(user.id).subscribe({
      next: (result) => {
        this.tempPasswordResult = result.temporaryPassword;
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to reset password');
      },
    });
  }

  toggleEnabled(user: any): void {
    const newState = user.enabled === false ? true : false;
    this.api.toggleUserEnabled(user.id, newState).subscribe({
      next: () => {
        user.enabled = newState;
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to toggle user status');
      },
    });
  }

  toggleKcMenu(userId: string): void {
    this.kcMenuOpen = this.kcMenuOpen === userId ? null : userId;
  }

  forceTotp(user: any): void {
    this.api.setUserRequiredActions(user.id, ['CONFIGURE_TOTP']).subscribe({
      next: () => alert('TOTP configuration will be required at next SSO login.'),
      error: (err) => alert(err.error?.message || 'Failed'),
    });
  }

  verifyEmail(user: any): void {
    this.api.sendUserVerifyEmail(user.id).subscribe({
      next: () => alert('Verification email sent.'),
      error: (err) => alert(err.error?.message || 'Failed'),
    });
  }

  forcePasswordChange(user: any): void {
    this.api.setUserRequiredActions(user.id, ['UPDATE_PASSWORD']).subscribe({
      next: () => alert('Password change will be required at next SSO login.'),
      error: (err) => alert(err.error?.message || 'Failed'),
    });
  }

  // --- Merge ---

  openMergeModal(): void {
    this.mergeKeepId = '';
    this.mergeRemoveId = '';
    this.mergeError = '';
    this.mergeModalOpen = true;
  }

  executeMerge(): void {
    this.mergeError = '';
    this.api.mergeUsers(this.mergeKeepId, this.mergeRemoveId).subscribe({
      next: () => {
        this.mergeModalOpen = false;
        this.loadData();
      },
      error: (err) => {
        this.mergeError = err.error?.message || 'Failed to merge users';
      },
    });
  }
}
