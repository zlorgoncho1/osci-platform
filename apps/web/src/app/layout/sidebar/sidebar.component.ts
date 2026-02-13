import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  resourceType?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <aside class="w-64 bg-[#080808] border-r border-white/10 flex flex-col h-full">
      <!-- Top accent bar -->
      <div class="h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>

      <!-- Logo -->
      <div class="p-6 border-b border-white/[0.08]">
        <div class="flex items-center gap-3">
          <img src="assets/logo/logo-white.png" alt="OSCI Platform" class="w-9 h-9 object-contain flex-shrink-0" />
          <div>
            <h1 class="font-brand font-bold text-sm tracking-tight text-white">OSCI Platform</h1>
            <p class="text-[10px] text-zinc-500 uppercase tracking-wider">Zero Trust IDP</p>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div *ngFor="let section of visibleSections">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500 px-3 mb-2">{{ section.title }}</p>
          <ul class="space-y-0.5">
            <li *ngFor="let item of section.items">
              <a [routerLink]="item.route" routerLinkActive="bg-white/[0.07] text-white"
                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-colors">
                <iconify-icon [attr.icon]="item.icon" width="18"></iconify-icon>{{ item.label }}
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Session status -->
      <div class="p-4 border-t border-white/[0.08]">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-2 h-2 rounded-full bg-emerald-500 status-dot-active"></div>
          <span class="text-[10px] uppercase tracking-wider text-emerald-500 font-mono">Session Active</span>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
            <iconify-icon icon="solar:user-id-linear" width="16" class="text-zinc-400"></iconify-icon>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-zinc-300 truncate">{{ userName }}</p>
            <p class="text-[10px] text-zinc-500 truncate">{{ userRole }}</p>
          </div>
          <button (click)="logout()" class="p-1.5 rounded-lg hover:bg-white/5 transition-colors" title="Logout">
            <iconify-icon icon="solar:logout-2-linear" width="16" class="text-zinc-500"></iconify-icon>
          </button>
        </div>
      </div>
    </aside>
  `,
})
export class SidebarComponent implements OnInit, OnDestroy {
  userName = 'Security Analyst';
  userRole = 'admin';

  private allSections: NavSection[] = [
    {
      title: 'Operational',
      items: [
        { label: 'Cockpit', icon: 'solar:widget-2-linear', route: '/app/cockpit' },
        { label: 'Objects', icon: 'solar:box-linear', route: '/app/objects', resourceType: 'object' },
        { label: 'Checklists', icon: 'solar:checklist-linear', route: '/app/checklists', resourceType: 'checklist' },
        { label: 'Remediation', icon: 'solar:clipboard-check-linear', route: '/app/remediation', resourceType: 'task' },
        { label: 'Projects', icon: 'solar:folder-security-linear', route: '/app/projects', resourceType: 'project' },
        { label: 'Cartography', icon: 'solar:map-linear', route: '/app/cartography', resourceType: 'cartography_asset' },
      ],
    },
    {
      title: 'Governance',
      items: [
        { label: 'Evidence & Audit', icon: 'solar:document-text-linear', route: '/app/audit', resourceType: 'audit_log' },
        { label: 'Référentiels', icon: 'solar:library-linear', route: '/app/referentiels', resourceType: 'referentiel' },
        { label: 'Reports', icon: 'solar:chart-square-linear', route: '/app/reports', resourceType: 'report' },
        { label: 'Incidents', icon: 'solar:shield-warning-linear', route: '/app/incidents', resourceType: 'incident' },
      ],
    },
    {
      title: 'Administration',
      items: [
        { label: 'Users', icon: 'solar:users-group-two-rounded-linear', route: '/app/admin/users', resourceType: 'user' },
        { label: 'User Groups', icon: 'solar:user-plus-rounded-linear', route: '/app/admin/user-groups', resourceType: 'user_group' },
        { label: 'Roles', icon: 'solar:key-linear', route: '/app/admin/roles', resourceType: 'user' },
      ],
    },
    {
      title: 'Ressources',
      items: [
        { label: 'Documentation', icon: 'solar:book-2-linear', route: '/app/docs' },
      ],
    },
  ];

  visibleSections: NavSection[] = [];

  private permissionsSub?: Subscription;

  constructor(
    private authService: AuthService,
    private permissionService: PermissionService,
  ) {}

  ngOnInit(): void {
    this.permissionService.loadPermissions().then(() => {
      this.buildNav();
    });
    this.permissionsSub = this.permissionService.permissions$.subscribe(() => {
      this.buildNav();
    });

    const profile = this.authService.userProfile;
    if (profile) {
      this.userName = profile['preferred_username'] || profile['name'] || 'User';
    }

    const me = this.permissionService.me;
    if (me) {
      this.userName = me.firstName || me.email || 'User';
    }

    const roles = this.permissionService.roles;
    if (roles.length > 0) {
      this.userRole = roles[0];
    } else {
      const jwtRoles = this.authService.userRoles;
      if (jwtRoles.length > 0) {
        this.userRole = jwtRoles[0];
      }
    }
  }

  ngOnDestroy(): void {
    this.permissionsSub?.unsubscribe();
  }

  private buildNav(): void {
    this.visibleSections = this.allSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (!item.resourceType) return true;
          return this.permissionService.canGlobal(item.resourceType, 'read');
        }),
      }))
      .filter((section) => section.items.length > 0);

    // Update user info
    const me = this.permissionService.me;
    if (me) {
      this.userName = me.firstName || me.email || 'User';
    }
    const roles = this.permissionService.roles;
    if (roles.length > 0) {
      this.userRole = roles[0];
    }
  }

  logout(): void {
    this.permissionService.clear();
    this.authService.logout();
  }
}
