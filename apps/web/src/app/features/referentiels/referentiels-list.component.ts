import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { PermissionService } from '../../core/services/permission.service';

const REFERENTIEL_TYPES = ['ISO', 'NIST', 'OWASP', 'SOC2', 'CIS', 'Internal'];

const DOMAINS = [
  { value: 'SecurityInfra', label: 'Security Infra' },
  { value: 'SecurityCode', label: 'Security Code' },
  { value: 'SecurityDevOps', label: 'Security DevOps' },
  { value: 'SecurityRepo', label: 'Security Repo' },
  { value: 'SecurityCluster', label: 'Security Cluster' },
  { value: 'SecurityPipeline', label: 'Security Pipeline' },
  { value: 'SecurityNetworking', label: 'Security Networking' },
  { value: 'SecurityTooling', label: 'Security Tooling' },
  { value: 'SecurityBackup', label: 'Security Backup' },
  { value: 'DisasterRecovery', label: 'Disaster Recovery' },
  { value: 'SecurityHuman', label: 'Security Human' },
  { value: 'FormationSecurity', label: 'Formation Security' },
  { value: 'AssuranceSecurity', label: 'Assurance Security' },
  { value: 'PolitiqueSecurity', label: 'Politique Security' },
  { value: 'Governance', label: 'Governance' },
  { value: 'Audit', label: 'Audit' },
  { value: 'Rapport', label: 'Rapport' },
  { value: 'DocumentsSecurity', label: 'Documents Security' },
  { value: 'SecurityData', label: 'Security Data' },
  { value: 'SecretsCredentials', label: 'Secrets & Credentials' },
  { value: 'NewTypeAttack', label: 'New Type Attack' },
  { value: 'IAPrompting', label: 'IA Prompting' },
  { value: 'Forensic', label: 'Forensic' },
  { value: 'Cartographie', label: 'Cartographie' },
  { value: 'PasswordSecurity', label: 'Password Security' },
  { value: 'PointSecurity', label: 'Point Security' },
  { value: 'SecurityPhysique', label: 'Sécurité Physique' },
  { value: 'SecuritySocialEngineering', label: 'Social Engineering' },
  { value: 'SecurityMalware', label: 'Malware' },
  { value: 'SecurityCrypto', label: 'Cryptographie' },
  { value: 'RiskManagement', label: 'Risk Management' },
  { value: 'ThirdPartyVendor', label: 'Third-Party / Vendor' },
  { value: 'AssetChangeManagement', label: 'Asset & Change Management' },
  { value: 'Resilience', label: 'Résilience' },
  { value: 'SecurityArchitecture', label: 'Security Architecture' },
  { value: 'IAMManagement', label: 'IAM Management' },
  { value: 'VulnerabilityManagement', label: 'Vulnerability Management' },
  { value: 'MaliciousActivityPrevention', label: 'Malicious Activity Prevention' },
  { value: 'Hardening', label: 'Hardening' },
  { value: 'AlertingMonitoring', label: 'Alerting & Monitoring' },
  { value: 'IncidentResponse', label: 'Incident Response' },
  { value: 'AutomationOrchestration', label: 'Automation & Orchestration' },
];

@Component({
  selector: 'app-referentiels-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-brand font-bold text-white">Referentiels</h1>
          <p class="text-xs text-zinc-500 mt-1">Compliance frameworks (ISO 27001, NIST CSF, SOC2, etc.)
            <a routerLink="/app/docs/module-referentiels"
               class="inline-flex items-center gap-1 ml-3 text-zinc-600 hover:text-emerald-400 transition-colors">
              <iconify-icon icon="solar:book-2-linear" width="12"></iconify-icon>
              <span class="text-[10px]">Guide</span>
            </a>
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="openCommunityModal()"
            class="px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800/50 text-sm font-brand font-semibold text-zinc-300 hover:bg-zinc-700/50 hover:border-zinc-600 transition-colors flex items-center gap-2">
            <iconify-icon icon="solar:global-linear" width="16"></iconify-icon>
            Community
          </button>
          <button *ngIf="perm.canGlobal('referentiel', 'create')" (click)="showCreateModal = true"
            class="px-4 py-2 bg-white text-black rounded-lg text-sm font-brand font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2">
            <iconify-icon icon="solar:add-circle-linear" width="16"></iconify-icon>
            New Referentiel
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="glass-panel p-4 flex items-center gap-4">
        <div class="relative flex-1 min-w-[200px]">
          <iconify-icon icon="solar:magnifer-linear" width="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"></iconify-icon>
          <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="loadReferentiels()" placeholder="Search referentiels..."
            class="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:border-white/20 focus:outline-none transition-colors" />
        </div>
        <select [(ngModel)]="filterType" (ngModelChange)="loadReferentiels()"
          class="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
          <option value="">All Types</option>
          <option *ngFor="let t of referentielTypes" [value]="t">{{ t }}</option>
        </select>
      </div>

      <!-- Table -->
      <div class="glass-panel overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/[0.08]">
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Code</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Name</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Domaine</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Version</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Type</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Exigences</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Coverage</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ref of referentiels" (click)="navigateToDetail(ref.id)"
              class="border-b border-white/[0.06] table-row-hover cursor-pointer">
              <td class="p-4 text-[11px] font-mono text-zinc-400">{{ ref.code }}</td>
              <td class="p-4 text-sm text-zinc-200">{{ ref.name }}</td>
              <td class="p-4 text-xs text-zinc-400">{{ getDomainLabel(ref.domain) }}</td>
              <td class="p-4 text-xs text-zinc-400">{{ ref.version }}</td>
              <td class="p-4">
                <span class="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800/50 text-zinc-400 text-[10px]">{{ ref.type }}</span>
              </td>
              <td class="p-4 text-xs text-zinc-400 font-mono">{{ ref.controls?.length || 0 }}</td>
              <td class="p-4">
                <span class="text-xs font-mono"
                  [ngClass]="getCoverageClass(referentielStats[ref.id] && referentielStats[ref.id].coveragePercent)">
                  {{ referentielStats[ref.id] ? referentielStats[ref.id].coveragePercent + '%' : '---' }}
                </span>
              </td>
            </tr>
            <tr *ngIf="referentiels.length === 0 && !loading">
              <td colspan="7" class="p-8 text-center text-xs text-zinc-500">
                <iconify-icon icon="solar:document-code-linear" width="32" class="text-zinc-700 mb-2"></iconify-icon>
                <p>No referentiels found</p>
                <p class="text-[10px] text-zinc-600 mt-1">Create one or import from the community repository</p>
              </td>
            </tr>
            <tr *ngIf="loading">
              <td colspan="7" class="p-8 text-center">
                <iconify-icon icon="solar:refresh-linear" width="24" class="text-zinc-600 animate-spin"></iconify-icon>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Create Modal -->
      <div *ngIf="showCreateModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="showCreateModal = false">
        <div class="glass-panel p-6 w-full max-w-md space-y-4" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-brand font-bold text-white">New Referentiel</h2>
            <button (click)="showCreateModal = false" class="p-1 rounded hover:bg-white/5 transition-colors">
              <iconify-icon icon="solar:close-circle-linear" width="20" class="text-zinc-500"></iconify-icon>
            </button>
          </div>
          <div class="space-y-3">
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Domaine</label>
              <select [(ngModel)]="newRef.domain"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                <option value="">— Choisir —</option>
                <option *ngFor="let d of domains" [value]="d.value">{{ d.label }}</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Nom</label>
              <input type="text" [(ngModel)]="newRef.name" placeholder="e.g. ISO 27001:2022"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Code</label>
              <input type="text" [(ngModel)]="newRef.code" placeholder="e.g. ISO27001"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Type</label>
                <select [(ngModel)]="newRef.type"
                  class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                  <option *ngFor="let t of referentielTypes" [value]="t">{{ t }}</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Version</label>
                <input type="text" [(ngModel)]="newRef.version" placeholder="e.g. 2022"
                  class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
              </div>
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Description (optionnel)</label>
              <textarea [(ngModel)]="newRef.description" rows="2" placeholder="Optionnel"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors resize-none"></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button (click)="showCreateModal = false"
              class="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400 font-brand hover:bg-white/5 transition-colors">Cancel</button>
            <button (click)="createReferentiel()" [disabled]="!newRef.code || !newRef.name"
              class="px-4 py-2 bg-white text-black rounded-lg text-sm font-brand font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">Create</button>
          </div>
        </div>
      </div>

      <!-- Community Modal -->
      <div *ngIf="showCommunityModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="showCommunityModal = false">
        <div class="glass-panel p-6 w-full max-w-3xl space-y-4 max-h-[85vh] flex flex-col" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-brand font-bold text-white">Community Referentiels</h2>
              <p class="text-[10px] text-zinc-500 mt-0.5">Import referentiels and checklists from the community repository</p>
            </div>
            <button (click)="showCommunityModal = false" class="p-1 rounded hover:bg-white/5 transition-colors">
              <iconify-icon icon="solar:close-circle-linear" width="20" class="text-zinc-500"></iconify-icon>
            </button>
          </div>

          <!-- Loading -->
          <div *ngIf="loadingCommunity" class="flex-1 flex items-center justify-center py-12">
            <div class="text-center">
              <iconify-icon icon="solar:refresh-linear" width="28" class="text-zinc-500 animate-spin"></iconify-icon>
              <p class="text-xs text-zinc-500 mt-3">Loading community referentiels...</p>
            </div>
          </div>

          <!-- Error -->
          <div *ngIf="communityError && !loadingCommunity" class="flex-1 flex items-center justify-center py-12">
            <div class="text-center">
              <iconify-icon icon="solar:danger-triangle-linear" width="28" class="text-red-400"></iconify-icon>
              <p class="text-xs text-red-400 mt-3">{{ communityError }}</p>
              <button (click)="loadCommunityReferentiels()" class="mt-3 px-3 py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-400 hover:bg-white/5 transition-colors">
                Retry
              </button>
            </div>
          </div>

          <!-- List -->
          <div *ngIf="!loadingCommunity && !communityError" class="flex-1 overflow-y-auto space-y-3 pr-1">
            <div *ngIf="communityReferentiels.length === 0" class="text-center py-12">
              <iconify-icon icon="solar:box-minimalistic-linear" width="28" class="text-zinc-600"></iconify-icon>
              <p class="text-xs text-zinc-500 mt-3">No community referentiels available</p>
            </div>

            <div *ngFor="let cr of communityReferentiels"
              class="rounded-lg border border-white/[0.08] bg-zinc-900/50 overflow-hidden">
              <!-- Referentiel Header -->
              <div class="p-4 flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0 cursor-pointer" (click)="toggleExpand(cr)">
                  <div class="flex items-center gap-2 mb-1">
                    <iconify-icon [icon]="expandedFolders[cr.folder] ? 'solar:alt-arrow-down-linear' : 'solar:alt-arrow-right-linear'"
                      width="14" class="text-zinc-500 flex-shrink-0"></iconify-icon>
                    <span class="text-sm font-brand font-semibold text-zinc-200">{{ cr.name }}</span>
                    <span class="px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800/50 text-[10px] text-zinc-400">{{ cr.type }}</span>
                    <span class="px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800/50 text-[10px] text-zinc-500">v{{ cr.version }}</span>
                  </div>
                  <p *ngIf="cr.description" class="text-[11px] text-zinc-500 mb-1.5 ml-5 line-clamp-2">{{ cr.description }}</p>
                  <div class="flex items-center gap-3 text-[10px] text-zinc-600 ml-5">
                    <span>{{ cr.controlCount }} controls</span>
                    <span>{{ cr.checklistCount }} checklists</span>
                  </div>
                </div>
                <div class="flex-shrink-0 flex items-center gap-2">
                  <span *ngIf="cr.alreadyImported"
                    class="px-3 py-1.5 rounded-lg border border-emerald-800/50 bg-emerald-900/20 text-[11px] text-emerald-400 font-brand font-medium">
                    All Imported
                  </span>
                  <button *ngIf="!cr.alreadyImported && perm.canGlobal('referentiel', 'create')" (click)="importAllFromReferentiel(cr)"
                    [disabled]="importingFolder === cr.folder"
                    class="px-3 py-1.5 rounded-lg bg-white text-[11px] text-black font-brand font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5">
                    <iconify-icon *ngIf="importingFolder === cr.folder" icon="solar:refresh-linear" width="12" class="animate-spin"></iconify-icon>
                    <iconify-icon *ngIf="importingFolder !== cr.folder" icon="solar:download-minimalistic-linear" width="12"></iconify-icon>
                    {{ importingFolder === cr.folder ? 'Importing...' : 'Import All' }}
                  </button>
                </div>
              </div>

              <!-- Expanded Checklists -->
              <div *ngIf="expandedFolders[cr.folder]" class="border-t border-white/[0.06]">
                <div *ngFor="let cl of cr.checklists; let last = last"
                  class="px-4 py-2.5 flex items-center justify-between gap-3"
                  [ngClass]="{'border-b border-white/5': !last}">
                  <div class="flex-1 min-w-0 ml-5">
                    <div class="flex items-center gap-2">
                      <span class="text-[11px] text-zinc-300 truncate">{{ cl.title }}</span>
                      <span class="px-1 py-0.5 rounded bg-zinc-800/80 text-[9px] text-zinc-500 flex-shrink-0">{{ cl.itemCount }} items</span>
                    </div>
                    <div class="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-600">
                      <span>{{ cl.domain }}</span>
                      <span class="text-zinc-700">&middot;</span>
                      <span>{{ cl.criticality }}</span>
                    </div>
                  </div>
                  <div class="flex-shrink-0">
                    <span *ngIf="cl.alreadyImported"
                      class="px-2 py-1 rounded border border-emerald-800/50 bg-emerald-900/20 text-[10px] text-emerald-400 font-medium">
                      Imported
                    </span>
                    <button *ngIf="!cl.alreadyImported && perm.canGlobal('checklist', 'create')" (click)="importSingleChecklist(cr, cl)"
                      [disabled]="importingChecklistKey === cr.folder + ':' + cl.index"
                      class="px-2 py-1 rounded-lg bg-blue-600 text-[10px] text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                      <iconify-icon *ngIf="importingChecklistKey === cr.folder + ':' + cl.index" icon="solar:refresh-linear" width="10" class="animate-spin"></iconify-icon>
                      <iconify-icon *ngIf="importingChecklistKey !== cr.folder + ':' + cl.index" icon="solar:download-minimalistic-linear" width="10"></iconify-icon>
                      {{ importingChecklistKey === cr.folder + ':' + cl.index ? 'Importing...' : 'Import' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ReferentielsListComponent implements OnInit {
  referentiels: any[] = [];
  referentielTypes = REFERENTIEL_TYPES;
  domains = DOMAINS;
  searchTerm = '';
  filterType = '';
  loading = false;
  showCreateModal = false;
  referentielStats: Record<string, { totalControls: number; mappedControls: number; coveragePercent: number }> = {};
  newRef = { code: '', name: '', type: 'ISO', version: '1.0', domain: '', description: '' };

  // Community
  showCommunityModal = false;
  communityReferentiels: any[] = [];
  loadingCommunity = false;
  communityError: string | null = null;
  importingFolder: string | null = null;
  importingChecklistKey: string | null = null;
  expandedFolders: Record<string, boolean> = {};

  constructor(private api: ApiService, private router: Router, public perm: PermissionService) {}

  ngOnInit(): void {
    this.loadReferentiels();
  }

  loadReferentiels(): void {
    this.loading = true;
    const params: any = { limit: 100 };
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.filterType) params.type = this.filterType;

    this.api.getReferentiels(params).subscribe({
      next: (res) => {
        this.referentiels = res.data || res || [];
        this.referentiels.forEach((ref) => this.loadStats(ref.id));
        this.loading = false;
      },
      error: () => {
        this.referentiels = [];
        this.loading = false;
      },
    });
  }

  loadStats(id: string): void {
    this.api.getReferentielStats(id).subscribe({
      next: (stats) => this.referentielStats[id] = stats,
    });
  }

  navigateToDetail(id: string): void {
    this.router.navigate(['/app/referentiels', id]);
  }

  getCoverageClass(pct?: number): string {
    if (pct == null || pct === undefined) return 'text-zinc-500';
    if (pct >= 80) return 'text-emerald-500';
    if (pct >= 50) return 'text-amber-500';
    return 'text-zinc-400';
  }

  getDomainLabel(value?: string): string {
    if (!value) return '\u2014';
    return this.domains.find((d) => d.value === value)?.label || value;
  }

  createReferentiel(): void {
    if (!this.newRef.code || !this.newRef.name) return;
    const payload = { ...this.newRef };
    if (!payload.domain) delete (payload as any).domain;
    this.api.createReferentiel(payload).subscribe({
      next: (ref) => {
        this.showCreateModal = false;
        this.newRef = { code: '', name: '', type: 'ISO', version: '1.0', domain: '', description: '' };
        this.router.navigate(['/app/referentiels', ref.id]);
      },
      error: (err) => console.error(err),
    });
  }

  // ─── Community ───────────────────────────────────────────────

  openCommunityModal(): void {
    this.showCommunityModal = true;
    this.loadCommunityReferentiels();
  }

  loadCommunityReferentiels(): void {
    this.loadingCommunity = true;
    this.communityError = null;
    this.api.getCommunityReferentiels().subscribe({
      next: (data) => {
        this.communityReferentiels = data;
        this.loadingCommunity = false;
      },
      error: () => {
        this.communityError = 'Failed to load community referentiels. Check your connection.';
        this.loadingCommunity = false;
      },
    });
  }

  toggleExpand(cr: any): void {
    this.expandedFolders[cr.folder] = !this.expandedFolders[cr.folder];
  }

  importAllFromReferentiel(cr: any): void {
    this.importingFolder = cr.folder;
    this.api.importCommunityReferentiel(cr.folder).subscribe({
      next: (result) => {
        this.importingFolder = null;
        if (result.status === 'created') {
          cr.alreadyImported = true;
          cr.checklists.forEach((cl: any) => cl.alreadyImported = true);
          this.loadReferentiels();
        }
      },
      error: () => {
        this.importingFolder = null;
      },
    });
  }

  importSingleChecklist(cr: any, cl: any): void {
    const key = cr.folder + ':' + cl.index;
    this.importingChecklistKey = key;
    this.api.importCommunityChecklist(cr.folder, cl.index).subscribe({
      next: (result) => {
        this.importingChecklistKey = null;
        if (result.status === 'created') {
          cl.alreadyImported = true;
          // Check if all checklists are now imported
          if (cr.checklists.every((c: any) => c.alreadyImported)) {
            cr.alreadyImported = true;
          }
          this.loadReferentiels();
        }
      },
      error: () => {
        this.importingChecklistKey = null;
      },
    });
  }
}
