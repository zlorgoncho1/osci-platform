import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ConfirmService } from '../../shared/components/confirm/confirm.service';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-checklists-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-brand font-bold text-white">Checklists</h1>
          <p class="text-xs text-zinc-500 mt-1">Security assessment templates</p>
        </div>
        <div class="flex items-center gap-2">
          <button *ngIf="selectedIds.size > 0" (click)="bulkDelete()"
            class="px-4 py-2 rounded-lg border border-rose-500/20 text-sm text-rose-500 font-brand font-semibold hover:bg-rose-500/10 transition-colors flex items-center gap-2">
            <iconify-icon icon="solar:trash-bin-trash-linear" width="16"></iconify-icon>
            Delete ({{ selectedIds.size }})
          </button>
          <button (click)="showCreateModal = true"
            class="px-4 py-2 bg-white text-black rounded-lg text-sm font-brand font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2">
            <iconify-icon icon="solar:add-circle-linear" width="16"></iconify-icon>
            New Checklist
          </button>
        </div>
      </div>

      <!-- Filter -->
      <div class="glass-panel p-4 flex items-center gap-4">
        <div class="relative flex-1">
          <iconify-icon icon="solar:magnifer-linear" width="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"></iconify-icon>
          <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="filterChecklists()" placeholder="Search checklists..."
            class="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:border-white/20 focus:outline-none transition-colors" />
        </div>
        <select [(ngModel)]="selectedDomain" (ngModelChange)="filterChecklists()"
          class="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
          <option value="">All Domains</option>
          <option *ngFor="let d of domains" [value]="d.value">{{ d.label }}</option>
        </select>
      </div>

      <!-- Table -->
      <div class="glass-panel overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/[0.08]">
              <th class="p-4 w-10">
                <input type="checkbox" [checked]="isAllSelected()" (change)="toggleSelectAll()"
                  class="w-3.5 h-3.5 rounded border-white/20 bg-zinc-900 text-white accent-white cursor-pointer" />
              </th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Title</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Domain</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Version</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Criticality</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Items</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let cl of filteredChecklists" class="border-b border-white/[0.06] table-row-hover">
              <td class="p-4">
                <input type="checkbox" [checked]="selectedIds.has(cl.id)" (change)="toggleSelect(cl.id)"
                  class="w-3.5 h-3.5 rounded border-white/20 bg-zinc-900 text-white accent-white cursor-pointer" />
              </td>
              <td class="p-4">
                <a [routerLink]="['/app/checklists', cl.id]" class="text-sm text-zinc-200 hover:text-white transition-colors hover:underline">{{ cl.title }}</a>
              </td>
              <td class="p-4">
                <span class="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800/50 text-zinc-400 text-[10px]">{{ getDomainLabel(cl.domain) }}</span>
              </td>
              <td class="p-4 text-xs text-zinc-400 font-mono">v{{ cl.version || '1.0' }}</td>
              <td class="p-4">
                <span class="px-2 py-0.5 rounded text-[10px]"
                  [ngClass]="{
                    'bg-rose-500/15 border border-rose-500/20 text-rose-500': cl.criticality === 'Critical',
                    'bg-amber-500/15 border border-amber-500/20 text-amber-500': cl.criticality === 'High',
                    'bg-blue-500/15 border border-blue-500/20 text-blue-500': cl.criticality === 'Medium',
                    'bg-zinc-500/15 border border-zinc-500/20 text-zinc-400': cl.criticality === 'Low'
                  }">{{ cl.criticality || 'Medium' }}</span>
              </td>
              <td class="p-4 text-xs text-zinc-400 font-mono">{{ cl.items?.length || 0 }}</td>
              <td class="p-4">
                <div class="flex items-center gap-2">
                  <button (click)="openRunModal(cl)"
                    class="px-3 py-1 rounded-lg border border-emerald-500/20 text-[10px] text-emerald-500 font-brand hover:bg-emerald-500/10 transition-colors flex items-center gap-1">
                    <iconify-icon icon="solar:play-linear" width="12"></iconify-icon>Run
                  </button>
                  <button (click)="deleteSingle(cl)"
                    class="p-1 rounded hover:bg-white/5 transition-colors">
                    <iconify-icon icon="solar:trash-bin-minimalistic-linear" width="14" class="text-zinc-600 hover:text-rose-500"></iconify-icon>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredChecklists.length === 0">
              <td colspan="7" class="p-8 text-center text-xs text-zinc-500">
                <iconify-icon icon="solar:checklist-linear" width="32" class="text-zinc-700 mb-2"></iconify-icon>
                <p>No checklists found</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Run Modal (Object or Group selector) -->
      <div *ngIf="showRunModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="showRunModal = false">
        <div class="glass-panel p-6 w-full max-w-md space-y-4" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-brand font-bold text-white">Run Checklist</h2>
            <button (click)="showRunModal = false" class="p-1 rounded hover:bg-white/5 transition-colors">
              <iconify-icon icon="solar:close-circle-linear" width="20" class="text-zinc-500"></iconify-icon>
            </button>
          </div>
          <p class="text-sm text-zinc-400">Run <span class="text-zinc-200">{{ selectedChecklist?.title }}</span> on an object or a group:</p>
          <div class="flex gap-2">
            <button (click)="runMode = 'object'; selectedObjectId = ''; selectedGroupId = ''"
              class="flex-1 px-3 py-2 rounded-lg text-xs font-brand transition-colors"
              [ngClass]="runMode === 'object' ? 'bg-white/10 border border-white/20 text-white' : 'border border-white/10 text-zinc-400 hover:bg-white/5'">
              Object
            </button>
            <button (click)="runMode = 'group'; selectedObjectId = ''; selectedGroupId = ''"
              class="flex-1 px-3 py-2 rounded-lg text-xs font-brand transition-colors"
              [ngClass]="runMode === 'group' ? 'bg-white/10 border border-white/20 text-white' : 'border border-white/10 text-zinc-400 hover:bg-white/5'">
              Group
            </button>
          </div>
          <div *ngIf="runMode === 'object'">
            <label class="text-[10px] text-zinc-500 mb-1 block">Object</label>
            <select [(ngModel)]="selectedObjectId"
              class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
              <option value="">Select an object...</option>
              <option *ngFor="let obj of availableObjects" [value]="obj.id">{{ obj.name }} ({{ obj.type }})</option>
            </select>
          </div>
          <div *ngIf="runMode === 'group'">
            <label class="text-[10px] text-zinc-500 mb-1 block">Group</label>
            <select [(ngModel)]="selectedGroupId"
              class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
              <option value="">Select a group...</option>
              <option *ngFor="let g of availableGroups" [value]="g.id">{{ g.name }} ({{ g.objects?.length || 0 }} objects)</option>
            </select>
          </div>
          <div class="flex justify-end gap-3">
            <button (click)="showRunModal = false"
              class="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400 font-brand hover:bg-white/5 transition-colors">Cancel</button>
            <button (click)="startRun()" [disabled]="!canStartRun"
              class="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-brand font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Start Run</button>
          </div>
        </div>
      </div>

      <!-- Create Modal -->
      <div *ngIf="showCreateModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="showCreateModal = false">
        <div class="glass-panel p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-brand font-bold text-white">Create Checklist</h2>
            <button (click)="showCreateModal = false" class="p-1 rounded hover:bg-white/5 transition-colors">
              <iconify-icon icon="solar:close-circle-linear" width="20" class="text-zinc-500"></iconify-icon>
            </button>
          </div>
          <div class="space-y-3">
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Title</label>
              <input type="text" [(ngModel)]="newChecklist.title"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Domain</label>
                <select [(ngModel)]="newChecklist.domain"
                  class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                  <option *ngFor="let d of domains" [value]="d.value">{{ d.label }}</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Criticality</label>
                <select [(ngModel)]="newChecklist.criticality"
                  class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Applicability (object types)</label>
              <div class="flex flex-wrap gap-2">
                <label *ngFor="let t of objectTypes"
                  class="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] cursor-pointer transition-colors"
                  [ngClass]="newChecklist.applicability.includes(t) ? 'border-white/20 bg-white/5 text-zinc-200' : 'border-white/10 text-zinc-500 hover:bg-white/[0.03]'">
                  <input type="checkbox" class="hidden" [checked]="newChecklist.applicability.includes(t)" (change)="toggleApplicability(t)" />
                  {{ t }}
                </label>
              </div>
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Description</label>
              <textarea [(ngModel)]="newChecklist.description" rows="2"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors resize-none"></textarea>
            </div>

            <!-- Items -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-[10px] uppercase tracking-wider text-zinc-500">Checklist Items ({{ newChecklist.items.length }})</label>
                <div class="flex items-center gap-3">
                  <button (click)="toggleImportPanel()" class="text-[10px] transition-colors flex items-center gap-1"
                    [ngClass]="showImportPanel ? 'text-blue-400' : 'text-blue-500/70 hover:text-blue-400'">
                    <iconify-icon icon="solar:library-linear" width="12"></iconify-icon>Import from Reference
                  </button>
                  <button (click)="addItem()" class="text-[10px] text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1">
                    <iconify-icon icon="solar:add-circle-linear" width="12"></iconify-icon>Add Item
                  </button>
                </div>
              </div>

              <!-- Import from Reference Panel -->
              <div *ngIf="showImportPanel" class="mb-3 p-3 rounded-lg border border-blue-500/20 bg-blue-500/[0.03]">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <button *ngIf="selectedRefChecklist" (click)="backToRefList()"
                      class="p-1 rounded hover:bg-white/5 transition-colors">
                      <iconify-icon icon="solar:arrow-left-linear" width="14" class="text-zinc-400"></iconify-icon>
                    </button>
                    <p class="text-[10px] uppercase tracking-wider text-blue-400">
                      {{ selectedRefChecklist ? selectedRefChecklist.title : 'Select a reference checklist' }}
                    </p>
                  </div>
                  <button (click)="showImportPanel = false" class="p-1 rounded hover:bg-white/5 transition-colors">
                    <iconify-icon icon="solar:close-circle-linear" width="14" class="text-zinc-500"></iconify-icon>
                  </button>
                </div>

                <ng-container *ngIf="!selectedRefChecklist">
                  <div class="relative mb-2">
                    <iconify-icon icon="solar:magnifer-linear" width="12" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600"></iconify-icon>
                    <input type="text" [(ngModel)]="importSearch" placeholder="Search reference checklists..."
                      class="w-full bg-zinc-900 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-zinc-300 placeholder-zinc-600 focus:border-white/20 focus:outline-none transition-colors" />
                  </div>
                  <div class="max-h-48 overflow-y-auto space-y-1">
                    <div *ngFor="let ref of filteredRefChecklists"
                      (click)="selectRefChecklist(ref)"
                      class="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/[0.05] cursor-pointer transition-colors">
                      <div>
                        <p class="text-xs text-zinc-300">{{ ref.title }}</p>
                        <p class="text-[9px] text-zinc-600">{{ getDomainLabel(ref.domain) }} · {{ ref.items?.length || '?' }} items</p>
                      </div>
                      <iconify-icon icon="solar:arrow-right-linear" width="14" class="text-zinc-600"></iconify-icon>
                    </div>
                    <p *ngIf="filteredRefChecklists.length === 0" class="text-[10px] text-zinc-600 text-center py-3">No reference checklists found</p>
                  </div>
                </ng-container>

                <ng-container *ngIf="selectedRefChecklist">
                  <div *ngIf="loadingRefItems" class="text-center py-6">
                    <iconify-icon icon="solar:refresh-linear" width="18" class="text-zinc-600 animate-spin"></iconify-icon>
                  </div>
                  <ng-container *ngIf="!loadingRefItems">
                    <div class="flex items-center justify-between mb-2">
                      <button (click)="toggleAllImportItems()" class="text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors">
                        {{ selectedImportItems.size === refChecklistItems.length ? 'Deselect All' : 'Select All (' + refChecklistItems.length + ')' }}
                      </button>
                      <span class="text-[10px] text-zinc-500">{{ selectedImportItems.size }}/{{ refChecklistItems.length }} selected</span>
                    </div>
                    <div class="max-h-48 overflow-y-auto space-y-1">
                      <label *ngFor="let item of refChecklistItems; let i = index"
                        class="flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors"
                        [ngClass]="selectedImportItems.has(i) ? 'bg-blue-500/10' : 'hover:bg-white/[0.03]'">
                        <input type="checkbox" [checked]="selectedImportItems.has(i)" (change)="toggleImportItem(i)"
                          class="mt-0.5 w-3.5 h-3.5 rounded border-white/20 bg-zinc-900 accent-blue-500 cursor-pointer" />
                        <div class="flex-1 min-w-0">
                          <p class="text-[11px] text-zinc-300 leading-snug">{{ item.question }}</p>
                          <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-[9px] text-zinc-600">{{ item.itemType }}</span>
                            <span *ngIf="item.referenceType" class="text-[9px] text-zinc-600">{{ item.referenceType }}: {{ item.reference }}</span>
                          </div>
                        </div>
                      </label>
                    </div>
                    <button (click)="importSelectedItems()" [disabled]="selectedImportItems.size === 0"
                      class="mt-2 w-full px-3 py-1.5 rounded-lg bg-blue-500 text-white text-[11px] font-brand font-semibold hover:bg-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                      Import {{ selectedImportItems.size }} item{{ selectedImportItems.size !== 1 ? 's' : '' }}
                    </button>
                  </ng-container>
                </ng-container>
              </div>

              <div class="space-y-2">
                <div *ngFor="let item of newChecklist.items; let i = index" class="flex items-start gap-2 p-3 bg-white/[0.02] rounded-lg border border-white/5">
                  <div class="flex-1 space-y-2">
                    <input type="text" [(ngModel)]="item.question" placeholder="Question..."
                      class="w-full bg-zinc-900 border border-white/10 rounded px-2 py-1.5 text-xs text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
                    <select [(ngModel)]="item.itemType"
                      class="bg-zinc-900 border border-white/10 rounded px-2 py-1 text-[10px] text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                      <option value="YesNo">Yes/No</option>
                      <option value="Score">Score</option>
                      <option value="Evidence">Evidence</option>
                      <option value="AutoCheck">Auto Check</option>
                    </select>
                  </div>
                  <button (click)="removeItem(i)" class="p-1.5 rounded-lg hover:bg-rose-500/10 border border-rose-500/20 transition-colors mt-1">
                    <iconify-icon icon="solar:trash-bin-trash-linear" width="14" class="text-rose-500"></iconify-icon>
                  </button>
                </div>
                <p *ngIf="newChecklist.items.length === 0" class="text-[10px] text-zinc-600 text-center py-3">At least one item is required</p>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button (click)="showCreateModal = false"
              class="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400 font-brand hover:bg-white/5 transition-colors">Cancel</button>
            <button (click)="createChecklist()"
              class="px-4 py-2 bg-white text-black rounded-lg text-sm font-brand font-semibold hover:bg-zinc-200 transition-colors">Create</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ChecklistsListComponent implements OnInit {
  domains = [
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
  ];
  objectTypes = ['Project', 'Human', 'Infrastructure', 'Codebase', 'Pipeline', 'Cluster', 'DataAsset', 'Tool', 'Network', 'AISystem', 'SystemTool', 'AgentTool', 'Server', 'Database'];

  checklists: any[] = [];
  filteredChecklists: any[] = [];
  availableObjects: any[] = [];
  availableGroups: any[] = [];
  searchTerm = '';
  selectedDomain = '';
  showCreateModal = false;
  showRunModal = false;
  runMode: 'object' | 'group' = 'object';
  selectedChecklist: any = null;
  selectedObjectId = '';
  selectedGroupId = '';
  newChecklist: any = this.getEmptyChecklist();
  selectedIds = new Set<string>();

  // Import from reference
  showImportPanel = false;
  allRefChecklists: any[] = [];
  selectedRefChecklist: any = null;
  refChecklistItems: any[] = [];
  selectedImportItems = new Set<number>();
  loadingRefItems = false;
  importSearch = '';

  constructor(private api: ApiService, private router: Router, private confirmService: ConfirmService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadChecklists();
    this.api.getObjects().subscribe({
      next: (data) => { this.availableObjects = data || []; },
      error: () => {},
    });
    this.api.getObjectGroups().subscribe({
      next: (data) => { this.availableGroups = data || []; },
      error: () => {},
    });
  }

  private getEmptyChecklist(): any {
    return {
      title: '',
      domain: 'SecurityInfra',
      criticality: 'Medium',
      applicability: [] as string[],
      description: '',
      items: [{ question: '', itemType: 'YesNo' }],
    };
  }

  loadChecklists(): void {
    this.api.getChecklists().subscribe({
      next: (data) => {
        this.checklists = data || [];
        this.filterChecklists();
      },
      error: () => {
        this.checklists = [];
        this.filteredChecklists = [];
      },
    });
  }

  filterChecklists(): void {
    this.filteredChecklists = this.checklists.filter((cl) => {
      const matchesSearch = !this.searchTerm ||
        cl['title']?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesDomain = !this.selectedDomain || cl['domain'] === this.selectedDomain;
      return matchesSearch && matchesDomain;
    });
  }

  getDomainLabel(value: string): string {
    return this.domains.find(d => d.value === value)?.label || value;
  }

  toggleApplicability(type: string): void {
    const idx = this.newChecklist.applicability.indexOf(type);
    if (idx >= 0) {
      this.newChecklist.applicability.splice(idx, 1);
    } else {
      this.newChecklist.applicability.push(type);
    }
  }

  addItem(): void {
    this.newChecklist.items.push({ question: '', itemType: 'YesNo' });
  }

  removeItem(index: number): void {
    this.newChecklist.items.splice(index, 1);
  }

  // Import from reference methods
  toggleImportPanel(): void {
    this.showImportPanel = !this.showImportPanel;
    this.selectedRefChecklist = null;
    this.refChecklistItems = [];
    this.selectedImportItems.clear();
    this.importSearch = '';
    if (this.showImportPanel && this.allRefChecklists.length === 0) {
      this.api.getReferenceChecklists().subscribe({
        next: (data) => { this.allRefChecklists = data || []; },
        error: () => { this.allRefChecklists = []; },
      });
    }
  }

  get filteredRefChecklists(): any[] {
    let refs = this.allRefChecklists;
    // Filter by current checklist domain
    if (this.newChecklist.domain) {
      refs = refs.filter((cl: any) => cl.domain === this.newChecklist.domain);
    }
    if (this.importSearch) {
      const term = this.importSearch.toLowerCase();
      refs = refs.filter((cl: any) => cl.title?.toLowerCase().includes(term) || cl.domain?.toLowerCase().includes(term));
    }
    return refs;
  }

  selectRefChecklist(cl: any): void {
    this.loadingRefItems = true;
    this.selectedRefChecklist = cl;
    this.selectedImportItems.clear();
    this.api.getChecklist(cl.id).subscribe({
      next: (data) => {
        this.refChecklistItems = data.items || [];
        this.loadingRefItems = false;
      },
      error: () => {
        this.refChecklistItems = [];
        this.loadingRefItems = false;
      },
    });
  }

  backToRefList(): void {
    this.selectedRefChecklist = null;
    this.refChecklistItems = [];
    this.selectedImportItems.clear();
  }

  toggleImportItem(index: number): void {
    if (this.selectedImportItems.has(index)) {
      this.selectedImportItems.delete(index);
    } else {
      this.selectedImportItems.add(index);
    }
  }

  toggleAllImportItems(): void {
    if (this.selectedImportItems.size === this.refChecklistItems.length) {
      this.selectedImportItems.clear();
    } else {
      this.refChecklistItems.forEach((_, i) => this.selectedImportItems.add(i));
    }
  }

  importSelectedItems(): void {
    // Remove default empty item if it's the only one and untouched
    if (this.newChecklist.items.length === 1 && !this.newChecklist.items[0].question?.trim()) {
      this.newChecklist.items = [];
    }
    for (const idx of Array.from(this.selectedImportItems).sort((a, b) => a - b)) {
      const item = this.refChecklistItems[idx];
      if (item) {
        this.newChecklist.items.push({
          question: item.question,
          itemType: item.itemType || 'YesNo',
          weight: item.weight || 1.0,
          expectedEvidence: item.expectedEvidence || '',
          referenceType: item.referenceType || '',
          reference: item.reference || '',
        });
      }
    }
    this.showImportPanel = false;
    this.selectedRefChecklist = null;
    this.selectedImportItems.clear();
  }

  get canStartRun(): boolean {
    return this.runMode === 'object' ? !!this.selectedObjectId : !!this.selectedGroupId;
  }

  openRunModal(checklist: any): void {
    this.selectedChecklist = checklist;
    this.runMode = 'object';
    this.selectedObjectId = '';
    this.selectedGroupId = '';
    this.showRunModal = true;
  }

  startRun(): void {
    if (!this.selectedChecklist || !this.canStartRun) return;
    const options = this.runMode === 'group'
      ? { objectGroupId: this.selectedGroupId }
      : { objectId: this.selectedObjectId };
    this.api.startChecklistRun(this.selectedChecklist['id'], options).subscribe({
      next: (res) => {
        this.showRunModal = false;
        const run = res?.runs?.length ? res.runs[0] : res;
        if (run?.id) {
          this.router.navigate(['/app/checklists', run.id, 'run']);
        } else {
          this.loadChecklists();
        }
      },
      error: (err) => console.error('[OSCI] Failed to start run:', err),
    });
  }

  createChecklist(): void {
    if (!this.newChecklist.title.trim()) return;
    if (this.newChecklist.items.length === 0 || !this.newChecklist.items[0].question.trim()) return;
    if (this.newChecklist.applicability.length === 0) return;

    const payload = {
      title: this.newChecklist.title,
      domain: this.newChecklist.domain,
      criticality: this.newChecklist.criticality,
      applicability: this.newChecklist.applicability,
      description: this.newChecklist.description || undefined,
      items: this.newChecklist.items.filter((i: any) => i.question.trim()),
    };

    this.api.createChecklist(payload).subscribe({
      next: () => {
        this.showCreateModal = false;
        this.newChecklist = this.getEmptyChecklist();
        this.loadChecklists();
      },
      error: (err) => console.error('[OSCI] Failed to create checklist:', err),
    });
  }

  toggleSelect(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  isAllSelected(): boolean {
    return this.filteredChecklists.length > 0 && this.filteredChecklists.every(cl => this.selectedIds.has(cl['id']));
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.filteredChecklists.forEach(cl => this.selectedIds.delete(cl['id']));
    } else {
      this.filteredChecklists.forEach(cl => this.selectedIds.add(cl['id']));
    }
  }

  async bulkDelete(): Promise<void> {
    const count = this.selectedIds.size;
    if (count === 0) return;
    const ok = await this.confirmService.confirm({
      title: 'Suppression multiple',
      message: `Supprimer ${count} checklist(s) ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    this.api.bulkDeleteChecklists(Array.from(this.selectedIds)).subscribe({
      next: () => {
        this.selectedIds.clear();
        this.loadChecklists();
        this.toast.success(`${count} checklist(s) supprimée(s)`);
      },
      error: (err) => console.error('[OSCI] Failed to bulk delete:', err),
    });
  }

  async deleteSingle(cl: any): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: 'Supprimer la checklist',
      message: `Supprimer « ${cl.title} » ?`,
      confirmText: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    this.api.deleteChecklist(cl['id']).subscribe({
      next: () => {
        this.selectedIds.delete(cl['id']);
        this.loadChecklists();
      },
      error: (err) => console.error('[OSCI] Failed to delete checklist:', err),
    });
  }
}
