import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface SearchResult {
  icon: string;
  label: string;
  sublabel: string;
  route: string;
  category: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <header class="h-14 border-b border-white/10 bg-[#080808]/80 backdrop-blur-sm flex items-center justify-between px-6">
      <div class="flex items-center gap-4">
        <span class="text-xs text-zinc-400 font-mono">{{ currentPath }}</span>
      </div>
      <div class="flex items-center gap-3">
        <button (click)="openPalette()"
          class="flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-lg px-4 py-1.5 text-xs text-zinc-500 hover:border-white/20 hover:text-zinc-400 transition-colors w-64">
          <iconify-icon icon="solar:magnifer-linear" width="14"></iconify-icon>
          <span class="flex-1 text-left">Search...</span>
          <kbd class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 border border-white/10 text-zinc-500">Ctrl+K</kbd>
        </button>
        <span *ngIf="isEncrypted" class="text-[9px] font-mono text-emerald-500/80 uppercase tracking-widest">Encrypted</span>
        <span *ngIf="!isEncrypted" class="text-[9px] font-mono text-amber-500/80 uppercase tracking-widest">Unencrypted</span>
        <div class="w-px h-5 bg-white/10 mx-1"></div>
        <button (click)="onLogout()"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-red-400 hover:bg-white/[0.05] transition-colors"
          title="Sign out">
          <iconify-icon icon="solar:logout-2-linear" width="16"></iconify-icon>
          <span class="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>

    <!-- Command Palette Overlay -->
    <div *ngIf="isOpen" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-[15vh]"
      (click)="closePalette()">
      <div class="w-full max-w-xl" (click)="$event.stopPropagation()">
        <!-- Search input -->
        <div class="glass-panel overflow-hidden">
          <div class="flex items-center gap-3 px-4 py-3 border-b border-white/5">
            <iconify-icon icon="solar:magnifer-linear" width="18" class="text-zinc-500"></iconify-icon>
            <input #searchInput type="text" [(ngModel)]="query" (ngModelChange)="onSearch()"
              (keydown.escape)="closePalette()"
              (keydown.arrowdown)="moveSelection(1, $event)"
              (keydown.arrowup)="moveSelection(-1, $event)"
              (keydown.enter)="selectCurrent()"
              placeholder="Search pages, objects, checklists, tasks..."
              class="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none" />
            <kbd class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 border border-white/10 text-zinc-600">ESC</kbd>
          </div>

          <!-- Results -->
          <div class="max-h-80 overflow-y-auto py-1">
            <!-- Quick navigation (always shown when empty query) -->
            <ng-container *ngIf="!query">
              <p class="text-[9px] uppercase tracking-wider text-zinc-600 px-4 pt-2 pb-1">Quick Navigation</p>
              <button *ngFor="let page of pages; let i = index"
                (click)="navigateTo(page.route)"
                (mouseenter)="selectedIndex = i"
                class="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors"
                [ngClass]="selectedIndex === i ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'">
                <iconify-icon [icon]="page.icon" width="16" class="text-zinc-500"></iconify-icon>
                <span class="text-sm text-zinc-300">{{ page.label }}</span>
                <span class="ml-auto text-[10px] text-zinc-600 font-mono">{{ page.route }}</span>
              </button>
            </ng-container>

            <!-- Search results -->
            <ng-container *ngIf="query">
              <ng-container *ngFor="let cat of resultCategories">
                <p class="text-[9px] uppercase tracking-wider text-zinc-600 px-4 pt-2 pb-1">{{ cat }}</p>
                <ng-container *ngFor="let result of getResultsByCategory(cat); let ri = index">
                  <button
                    (click)="navigateTo(result.route)"
                    (mouseenter)="selectedIndex = getGlobalIndex(result)"
                    class="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors"
                    [ngClass]="selectedIndex === getGlobalIndex(result) ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'">
                    <iconify-icon [icon]="result.icon" width="16" class="text-zinc-500"></iconify-icon>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-zinc-300 truncate">{{ result.label }}</p>
                      <p class="text-[10px] text-zinc-600 truncate">{{ result.sublabel }}</p>
                    </div>
                  </button>
                </ng-container>
              </ng-container>

              <div *ngIf="results.length === 0 && !searching" class="px-4 py-6 text-center">
                <iconify-icon icon="solar:magnifer-linear" width="24" class="text-zinc-700 mb-2"></iconify-icon>
                <p class="text-xs text-zinc-600">No results for "{{ query }}"</p>
              </div>

              <div *ngIf="searching" class="px-4 py-6 text-center">
                <iconify-icon icon="solar:refresh-linear" width="18" class="text-zinc-600 animate-spin"></iconify-icon>
              </div>
            </ng-container>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentPath = '/app/cockpit';
  isOpen = false;
  query = '';
  results: SearchResult[] = [];
  selectedIndex = 0;
  searching = false;

  private routerSub: Subscription | null = null;
  private searchTimeout: any = null;

  pages: { icon: string; label: string; route: string }[] = [
    { icon: 'solar:widget-2-linear', label: 'Cockpit', route: '/app/cockpit' },
    { icon: 'solar:box-linear', label: 'Objects', route: '/app/objects' },
    { icon: 'solar:checklist-linear', label: 'Checklists', route: '/app/checklists' },
    { icon: 'solar:clipboard-check-linear', label: 'Remediation', route: '/app/remediation' },
    { icon: 'solar:folder-security-linear', label: 'Projects', route: '/app/projects' },
    { icon: 'solar:map-linear', label: 'Cartography', route: '/app/cartography' },
    { icon: 'solar:document-text-linear', label: 'Evidence & Audit', route: '/app/audit' },
    { icon: 'solar:chart-square-linear', label: 'Reports', route: '/app/reports' },
    { icon: 'solar:shield-warning-linear', label: 'Incidents', route: '/app/incidents' },
  ];

  constructor(
    private router: Router,
    private api: ApiService,
    private authService: AuthService,
  ) {}

  private keydownHandler = (event: KeyboardEvent): void => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      event.stopPropagation();
      this.togglePalette();
    }
  };

  get isEncrypted(): boolean {
    return typeof window !== 'undefined' && window.location?.protocol === 'https:';
  }

  ngOnInit(): void {
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentPath = event.urlAfterRedirects || event.url;
      });
    this.currentPath = this.router.url;
    document.addEventListener('keydown', this.keydownHandler, { capture: true });
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.keydownHandler, { capture: true });
    this.routerSub?.unsubscribe();
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
  }

  openPalette(): void {
    this.isOpen = true;
    this.query = '';
    this.results = [];
    this.selectedIndex = 0;
    setTimeout(() => {
      const input = document.querySelector('input[placeholder*="Search pages"]') as HTMLInputElement;
      input?.focus();
    }, 50);
  }

  closePalette(): void {
    this.isOpen = false;
    this.query = '';
    this.results = [];
  }

  togglePalette(): void {
    if (this.isOpen) {
      this.closePalette();
    } else {
      this.openPalette();
    }
  }

  onSearch(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);

    if (!this.query.trim()) {
      this.results = [];
      this.selectedIndex = 0;
      return;
    }

    const term = this.query.toLowerCase();

    // Immediate: filter pages
    const pageResults: SearchResult[] = this.pages
      .filter(p => p.label.toLowerCase().includes(term))
      .map(p => ({
        icon: p.icon,
        label: p.label,
        sublabel: p.route,
        route: p.route,
        category: 'Pages',
      }));

    this.results = pageResults;
    this.selectedIndex = 0;

    // Debounced: search backend entities
    this.searching = true;
    this.searchTimeout = setTimeout(() => {
      let pending = 3;
      const finish = () => { if (--pending === 0) this.searching = false; };

      this.api.getObjects().subscribe({
        next: (objects) => {
          const matched = (objects || [])
            .filter((o: any) => o.name?.toLowerCase().includes(term) || o.type?.toLowerCase().includes(term))
            .slice(0, 5)
            .map((o: any) => ({
              icon: 'solar:box-linear',
              label: o.name,
              sublabel: o.type,
              route: `/app/objects/${o.id}`,
              category: 'Objects',
            }));
          this.results = [...this.results.filter(r => r.category !== 'Objects'), ...matched];
          finish();
        },
        error: finish,
      });

      this.api.getChecklists().subscribe({
        next: (checklists) => {
          const matched = (checklists || [])
            .filter((c: any) => c.title?.toLowerCase().includes(term) || c.domain?.toLowerCase().includes(term))
            .slice(0, 5)
            .map((c: any) => ({
              icon: 'solar:checklist-linear',
              label: c.title,
              sublabel: `${c.domain} - ${c.criticality}`,
              route: `/app/checklists/${c.id}`,
              category: 'Checklists',
            }));
          this.results = [...this.results.filter(r => r.category !== 'Checklists'), ...matched];
          finish();
        },
        error: finish,
      });

      this.api.getTasks().subscribe({
        next: (tasks) => {
          const matched = (tasks || [])
            .filter((t: any) => t.title?.toLowerCase().includes(term))
            .slice(0, 5)
            .map((t: any) => ({
              icon: 'solar:clipboard-check-linear',
              label: t.title,
              sublabel: `${t.status} - ${t.priority}`,
              route: '/app/remediation',
              category: 'Tasks',
            }));
          this.results = [...this.results.filter(r => r.category !== 'Tasks'), ...matched];
          finish();
        },
        error: finish,
      });
    }, 250);
  }

  get resultCategories(): string[] {
    const cats: string[] = [];
    for (const r of this.results) {
      if (!cats.includes(r.category)) cats.push(r.category);
    }
    return cats;
  }

  getResultsByCategory(cat: string): SearchResult[] {
    return this.results.filter(r => r.category === cat);
  }

  getGlobalIndex(result: SearchResult): number {
    return this.results.indexOf(result);
  }

  get currentItems(): any[] {
    return this.query ? this.results : this.pages;
  }

  moveSelection(delta: number, event: Event): void {
    event.preventDefault();
    const max = this.currentItems.length;
    if (max === 0) return;
    this.selectedIndex = (this.selectedIndex + delta + max) % max;
  }

  selectCurrent(): void {
    const items = this.currentItems;
    if (items.length === 0) return;
    const item = items[this.selectedIndex];
    if (item) {
      this.navigateTo(item.route);
    }
  }

  navigateTo(route: string): void {
    this.closePalette();
    this.router.navigateByUrl(route);
  }

  onLogout(): void {
    this.authService.logout();
  }
}
