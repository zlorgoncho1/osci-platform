import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

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
        <!-- Operational -->
        <div>
          <p class="text-[10px] uppercase tracking-wider text-zinc-500 px-3 mb-2">Operational</p>
          <ul class="space-y-0.5">
            <li>
              <a routerLink="/app/cockpit" routerLinkActive="bg-white/[0.07] text-white"
                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-colors">
                <iconify-icon icon="solar:widget-2-linear" width="18"></iconify-icon>Cockpit
              </a>
            </li>
            <li>
              <a routerLink="/app/objects" routerLinkActive="bg-white/[0.07] text-white"
                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-colors">
                <iconify-icon icon="solar:box-linear" width="18"></iconify-icon>Objects
              </a>
            </li>
            <li>
              <a routerLink="/app/checklists" routerLinkActive="bg-white/[0.07] text-white"
                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-colors">
                <iconify-icon icon="solar:checklist-linear" width="18"></iconify-icon>Checklists
              </a>
            </li>
            <li>
              <a routerLink="/app/remediation" routerLinkActive="bg-white/[0.07] text-white"
                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-colors">
                <iconify-icon icon="solar:clipboard-check-linear" width="18"></iconify-icon>Remediation
              </a>
            </li>
            <li>
              <a routerLink="/app/projects" routerLinkActive="bg-white/[0.07] text-white"
                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-colors">
                <iconify-icon icon="solar:folder-security-linear" width="18"></iconify-icon>Projects
              </a>
            </li>
            <li>
              <a routerLink="/app/cartography" routerLinkActive="bg-white/[0.07] text-white"
                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-colors">
                <iconify-icon icon="solar:map-linear" width="18"></iconify-icon>Cartography
              </a>
            </li>
          </ul>
        </div>

        <!-- Governance -->
        <div>
          <p class="text-[10px] uppercase tracking-wider text-zinc-500 px-3 mb-2">Governance</p>
          <ul class="space-y-0.5">
            <li>
              <a routerLink="/app/audit" routerLinkActive="bg-white/[0.07] text-white"
                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-colors">
                <iconify-icon icon="solar:document-text-linear" width="18"></iconify-icon>Evidence & Audit
              </a>
            </li>
            <li>
              <a routerLink="/app/referentiels" routerLinkActive="bg-white/[0.07] text-white"
                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-colors">
                <iconify-icon icon="solar:library-linear" width="18"></iconify-icon>Référentiels
              </a>
            </li>
            <li>
              <a routerLink="/app/reports" routerLinkActive="bg-white/[0.07] text-white"
                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-colors">
                <iconify-icon icon="solar:chart-square-linear" width="18"></iconify-icon>Reports
              </a>
            </li>
            <li>
              <a routerLink="/app/incidents" routerLinkActive="bg-white/[0.07] text-white"
                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-colors">
                <iconify-icon icon="solar:shield-warning-linear" width="18"></iconify-icon>Incidents
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
export class SidebarComponent {
  userName = 'Security Analyst';
  userRole = 'admin';

  constructor(private authService: AuthService) {
    const profile = this.authService.userProfile;
    if (profile) {
      this.userName = profile['preferred_username'] || profile['name'] || 'User';
    }
    const roles = this.authService.userRoles;
    if (roles.length > 0) {
      this.userRole = roles.find(r => ['admin', 'auditor', 'analyst', 'viewer'].includes(r)) || roles[0];
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
