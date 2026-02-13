import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, switchMap, of, takeUntil, catchError, tap } from 'rxjs';
import { marked } from 'marked';

interface DocItem {
  slug: string;
  title: string;
  description: string;
}

interface DocSection {
  title: string;
  items: DocItem[];
}

interface DocIndex {
  title: string;
  sections: DocSection[];
}

/** Regex matching a bare doc slug (no protocol, no slash, no extension). */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

@Component({
  selector: 'app-doc-viewer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <!-- ─── Index page (no slug) ─── -->
    <div *ngIf="!slug" class="space-y-6">
      <!-- Page header — same pattern as Cockpit / Projects / Objects -->
      <div>
        <h1 class="text-2xl font-brand font-bold text-white">Documentation</h1>
        <p class="text-xs text-zinc-500 mt-1">Parcourez la documentation de la plateforme OSCI</p>
      </div>

      <!-- Sections grid -->
      <div *ngFor="let section of docIndex?.sections" class="space-y-3">
        <p class="text-[10px] uppercase tracking-wider text-zinc-400">{{ section.title }}</p>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a *ngFor="let item of section.items"
             [routerLink]="['/app/docs', item.slug]"
             class="glass-panel p-4 hover:bg-white/[0.04] transition-colors group cursor-pointer block">
            <h3 class="text-sm font-brand font-medium text-zinc-200 group-hover:text-white transition-colors">{{ item.title }}</h3>
            <p class="text-[10px] text-zinc-400 mt-1">{{ item.description }}</p>
          </a>
        </div>
      </div>
    </div>

    <!-- ─── Doc page (with slug) ─── -->
    <div *ngIf="slug" class="space-y-6">
      <!-- Page header -->
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <a routerLink="/app/docs"
               class="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors font-brand">Documentation</a>
            <span class="text-[10px] text-zinc-600">/</span>
            <span class="text-[10px] text-zinc-400 font-brand">{{ currentTitle }}</span>
          </div>
          <h1 class="text-2xl font-brand font-bold text-white">{{ currentTitle }}</h1>
          <p *ngIf="currentDescription" class="text-xs text-zinc-500 mt-1">{{ currentDescription }}</p>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="glass-panel p-6 flex items-center gap-2 text-zinc-500 text-xs">
        <div class="w-4 h-4 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin"></div>
        Chargement...
      </div>

      <!-- Error / 404 -->
      <div *ngIf="error" class="glass-panel p-6 text-center py-12">
        <iconify-icon icon="solar:document-text-broken" width="32" class="text-zinc-700"></iconify-icon>
        <p class="text-xs text-zinc-600 mt-3">Document introuvable</p>
        <a routerLink="/app/docs" class="text-[10px] text-emerald-500 hover:text-emerald-400 mt-2 inline-block font-brand">
          Retour à la documentation
        </a>
      </div>

      <!-- Content -->
      <div *ngIf="htmlContent" class="glass-panel p-6">
        <div class="doc-content"
             [innerHTML]="htmlContent"
             (click)="onContentClick($event)"></div>
      </div>

      <!-- Prev / Next navigation -->
      <div *ngIf="htmlContent && (prevItem || nextItem)" class="grid grid-cols-2 gap-4">
        <a *ngIf="prevItem; else emptyPrev"
           [routerLink]="['/app/docs', prevItem.slug]"
           class="glass-panel p-4 hover:bg-white/[0.04] transition-colors group">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Précédent</p>
          <p class="text-sm font-brand font-medium text-zinc-300 group-hover:text-white transition-colors flex items-center gap-1.5">
            <iconify-icon icon="solar:arrow-left-linear" width="14"></iconify-icon>
            {{ prevItem.title }}
          </p>
        </a>
        <ng-template #emptyPrev><div></div></ng-template>
        <a *ngIf="nextItem"
           [routerLink]="['/app/docs', nextItem.slug]"
           class="glass-panel p-4 hover:bg-white/[0.04] transition-colors group text-right"
           [class.col-start-2]="!prevItem">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Suivant</p>
          <p class="text-sm font-brand font-medium text-zinc-300 group-hover:text-white transition-colors flex items-center gap-1.5 justify-end">
            {{ nextItem.title }}
            <iconify-icon icon="solar:arrow-right-linear" width="14"></iconify-icon>
          </p>
        </a>
      </div>
    </div>

    <!-- ─── Footer ─── -->
    <footer class="mt-12 border-t border-white/[0.08] pt-8 pb-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div class="md:col-span-1">
          <img src="assets/logo/logo-white.png" alt="OSCI Platform" class="h-8 mb-3">
          <p class="text-[10px] text-zinc-500 leading-relaxed">
            Plateforme de pilotage de la sécurité Zero Trust. Centralisez vos contrôles, mesurez votre posture et prouvez votre conformité.
          </p>
        </div>
        <div>
          <p class="text-[10px] uppercase tracking-wider text-zinc-400 mb-3">Documentation</p>
          <div class="space-y-2">
            <a routerLink="/app/docs/welcome" class="block text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Bienvenue</a>
            <a routerLink="/app/docs/getting-started" class="block text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Premiers pas</a>
            <a routerLink="/app/docs/deployment" class="block text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Déploiement</a>
            <a routerLink="/app/docs/key-concepts" class="block text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Concepts clés</a>
          </div>
        </div>
        <div>
          <p class="text-[10px] uppercase tracking-wider text-zinc-400 mb-3">Modules</p>
          <div class="space-y-2">
            <a routerLink="/app/docs/module-cockpit" class="block text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Cockpit</a>
            <a routerLink="/app/docs/module-objects" class="block text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Objets</a>
            <a routerLink="/app/docs/module-checklists" class="block text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Checklists</a>
            <a routerLink="/app/docs/module-remediation" class="block text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Remédiation</a>
          </div>
        </div>
        <div>
          <p class="text-[10px] uppercase tracking-wider text-zinc-400 mb-3">Liens</p>
          <div class="space-y-2">
            <a href="https://github.com/zlorgoncho1/osci-platform" target="_blank" rel="noopener"
               class="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              <iconify-icon icon="mdi:github" width="14"></iconify-icon>
              Code source
            </a>
            <a href="https://github.com/zlorgoncho1/osci-referentiel" target="_blank" rel="noopener"
               class="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              <iconify-icon icon="mdi:github" width="14"></iconify-icon>
              Référentiels
            </a>
            <a routerLink="/app/dashboard"
               class="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              <iconify-icon icon="solar:monitor-smartphone-linear" width="14"></iconify-icon>
              Dashboard
            </a>
          </div>
        </div>
      </div>
      <div class="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between">
        <p class="text-[10px] text-zinc-600">zlorgoncho1 | OSCI Platform | 2026</p>
        <p class="text-[10px] text-zinc-600">Sécurité Zero Trust</p>
      </div>
    </footer>
  `,
})
export class DocViewerComponent implements OnInit, OnDestroy {
  docIndex: DocIndex | null = null;
  slug: string | null = null;
  htmlContent: SafeHtml | null = null;
  loading = false;
  error = false;
  prevItem: DocItem | null = null;
  nextItem: DocItem | null = null;
  currentTitle = '';
  currentDescription = '';

  private destroy$ = new Subject<void>();
  private knownSlugs = new Set<string>();

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.http.get<DocIndex>('/assets/docs/index.json')
      .pipe(takeUntil(this.destroy$))
      .subscribe(idx => {
        this.docIndex = idx;
        this.knownSlugs = new Set(idx.sections.flatMap(s => s.items.map(i => i.slug)));
        this.updateCurrentMeta();
      });

    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        tap(() => {
          this.htmlContent = null;
          this.error = false;
          this.loading = false;
          this.prevItem = null;
          this.nextItem = null;
          this.currentTitle = '';
          this.currentDescription = '';
        }),
        switchMap(params => {
          this.slug = params.get('slug');
          this.updateCurrentMeta();
          if (!this.slug) return of(null);
          this.loading = true;
          return this.http.get(`/assets/docs/${this.slug}.md`, { responseType: 'text' })
            .pipe(catchError(() => { this.error = true; this.loading = false; return of(null); }));
        }),
      )
      .subscribe(md => {
        this.loading = false;
        if (md) {
          const raw = marked.parse(md as string) as string;
          this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(raw);
          this.computeNavigation();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onContentClick(event: MouseEvent): void {
    const target = (event.target as HTMLElement).closest('a');
    if (!target) return;

    const href = target.getAttribute('href');
    if (!href) return;

    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return;
    if (href.startsWith('#')) return;

    const slug = href.replace(/\.md$/, '');
    if (SLUG_RE.test(slug) && this.knownSlugs.has(slug)) {
      event.preventDefault();
      this.router.navigate(['/app/docs', slug]);
    }
  }

  private updateCurrentMeta(): void {
    if (!this.docIndex || !this.slug) return;
    const item = this.docIndex.sections.flatMap(s => s.items).find(i => i.slug === this.slug);
    if (item) {
      this.currentTitle = item.title;
      this.currentDescription = item.description;
    }
  }

  private computeNavigation(): void {
    if (!this.docIndex || !this.slug) return;
    const allItems = this.docIndex.sections.flatMap(s => s.items);
    const idx = allItems.findIndex(i => i.slug === this.slug);
    if (idx < 0) return;
    this.prevItem = idx > 0 ? allItems[idx - 1] : null;
    this.nextItem = idx < allItems.length - 1 ? allItems[idx + 1] : null;
  }
}
