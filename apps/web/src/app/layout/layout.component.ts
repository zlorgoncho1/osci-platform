import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-[#020202]">
      <!-- Sidebar -->
      <app-sidebar></app-sidebar>

      <!-- Main content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Header -->
        <app-header></app-header>

        <!-- Content area -->
        <main class="flex-1 overflow-y-auto p-6 bg-grid">
          <div class="max-w-7xl mx-auto">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
})
export class LayoutComponent {}
