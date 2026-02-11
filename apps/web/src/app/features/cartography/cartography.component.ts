import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ConfirmService } from '../../shared/components/confirm/confirm.service';
import { ScoreGaugeComponent } from '../../shared/components/score-gauge/score-gauge.component';
import { TopologyGraphComponent } from './topology-graph.component';
import { TopologyToolbarComponent, ASSET_TYPES, RELATION_TYPES } from './topology-toolbar.component';
import { TopologyLegendComponent } from './topology-legend.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cartography',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ScoreGaugeComponent,
    TopologyGraphComponent,
    TopologyToolbarComponent,
    TopologyLegendComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-brand font-bold text-white">Cartography</h1>
          <p class="text-xs text-zinc-500 mt-1">Interactive topology mapping & impact analysis</p>
        </div>
        <div class="flex items-center gap-2">
          <!-- View Toggle -->
          <div class="flex items-center bg-zinc-900 rounded-lg border border-white/5 p-0.5">
            <button (click)="viewMode = 'graph'" [class.active-tab]="viewMode === 'graph'"
              class="px-3 py-1.5 rounded-md text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5">
              <iconify-icon icon="solar:atom-linear" width="14"></iconify-icon>
              Graph
            </button>
            <button (click)="viewMode = 'table'" [class.active-tab]="viewMode === 'table'"
              class="px-3 py-1.5 rounded-md text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5">
              <iconify-icon icon="solar:list-linear" width="14"></iconify-icon>
              Table
            </button>
          </div>
          <button (click)="openAddAssetModal()"
            class="px-4 py-2 bg-white text-black rounded-lg text-sm font-brand font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2">
            <iconify-icon icon="solar:add-circle-linear" width="16"></iconify-icon>
            Add Asset
          </button>
          <button (click)="showRelationModal = true" [disabled]="assets.length < 2"
            class="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400 font-brand hover:bg-white/5 transition-colors flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed">
            <iconify-icon icon="solar:link-linear" width="16"></iconify-icon>
            New Relation
          </button>
        </div>
      </div>

      <!-- Toolbar (graph mode only) -->
      <app-topology-toolbar *ngIf="viewMode === 'graph'"
        [currentLayout]="currentLayout"
        (layoutChange)="onLayoutChange($event)"
        (filtersChange)="onFiltersChange($event)"
        (searchChange)="onGraphSearchChange($event)"
        (fitView)="onFitView()"
        (exportPng)="onExportPng()">
      </app-topology-toolbar>

      <!-- Graph View -->
      <div *ngIf="viewMode === 'graph'" class="grid gap-4" [ngClass]="selectedAsset ? 'grid-cols-12' : 'grid-cols-1'">
        <!-- Graph -->
        <div [ngClass]="selectedAsset ? 'col-span-9' : 'col-span-1'" class="relative" style="height: calc(100vh - 220px);">
          <app-topology-graph #topologyGraph
            (nodeSelected)="onNodeSelected($event)"
            (nodeHovered)="hoveredNode = $event">
          </app-topology-graph>

          <!-- Legend overlay -->
          <div class="absolute bottom-3 left-3 z-10">
            <app-topology-legend></app-topology-legend>
          </div>

          <!-- Tooltip -->
          <div *ngIf="hoveredNode" class="absolute top-3 right-3 z-10 glass-panel p-3 text-[10px] space-y-1 min-w-[160px]">
            <p class="text-sm text-white font-brand font-semibold">{{ hoveredNode.name }}</p>
            <p class="text-zinc-400">Type: <span class="text-zinc-300">{{ hoveredNode.type }}</span></p>
            <p *ngIf="hoveredNode.score != null" class="text-zinc-400">Score: <span [class]="getScoreClass(hoveredNode.score)">{{ hoveredNode.score }}%</span></p>
            <p *ngIf="hoveredNode.openIncidents > 0" class="text-rose-400">Open incidents: {{ hoveredNode.openIncidents }}</p>
          </div>
        </div>

        <!-- Sidebar -->
        <div *ngIf="selectedAsset" class="col-span-3 space-y-4 overflow-y-auto" style="max-height: calc(100vh - 220px);">
          <!-- Asset Detail -->
          <div class="glass-panel p-4 space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-brand font-bold text-white truncate">{{ selectedAsset.object?.name || selectedAsset.name }}</h3>
              <button (click)="closeSidebar()"
                class="p-1 rounded hover:bg-white/5 transition-colors">
                <iconify-icon icon="solar:close-circle-linear" width="16" class="text-zinc-500"></iconify-icon>
              </button>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800/50 text-zinc-400 text-[10px]">{{ selectedAsset.object?.type || selectedAsset.type }}</span>
              <span *ngIf="selectedAsset.criticality" class="px-2 py-0.5 rounded text-[10px]"
                [ngClass]="{
                  'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20': selectedAsset.criticality === 'Low',
                  'bg-amber-500/10 text-amber-500 border border-amber-500/20': selectedAsset.criticality === 'Medium',
                  'bg-orange-500/10 text-orange-500 border border-orange-500/20': selectedAsset.criticality === 'High',
                  'bg-rose-500/10 text-rose-500 border border-rose-500/20': selectedAsset.criticality === 'Critical'
                }">{{ selectedAsset.criticality }}</span>
              <span *ngIf="selectedAsset.objectId" class="px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">linked</span>
            </div>
            <p *ngIf="selectedAsset.description" class="text-[10px] text-zinc-500">{{ selectedAsset.description }}</p>
          </div>

          <!-- Score Gauge -->
          <div *ngIf="selectedAssetScore != null" class="glass-panel p-4 flex flex-col items-center">
            <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Security Score</p>
            <app-score-gauge [score]="selectedAssetScore" size="sm"></app-score-gauge>
          </div>

          <!-- Incidents -->
          <div *ngIf="selectedAssetIncidents.length > 0" class="glass-panel p-4">
            <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Open Incidents ({{ selectedAssetIncidents.length }})</p>
            <div class="space-y-1.5 max-h-32 overflow-y-auto">
              <div *ngFor="let inc of selectedAssetIncidents" class="flex items-center gap-2 p-2 bg-white/[0.02] rounded-lg border border-white/5 text-[10px]">
                <span class="px-1.5 py-0.5 rounded text-[8px]"
                  [ngClass]="{
                    'bg-emerald-500/10 text-emerald-500': inc.severity === 'Low',
                    'bg-amber-500/10 text-amber-500': inc.severity === 'Medium',
                    'bg-orange-500/10 text-orange-500': inc.severity === 'High',
                    'bg-rose-500/10 text-rose-500': inc.severity === 'Critical'
                  }">{{ inc.severity }}</span>
                <span class="text-zinc-300 truncate">{{ inc.title }}</span>
              </div>
            </div>
          </div>

          <!-- Relations -->
          <div class="glass-panel p-4">
            <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Relations ({{ selectedAssetRelations.length }})</p>
            <div class="space-y-1.5 max-h-40 overflow-y-auto">
              <div *ngFor="let rel of selectedAssetRelations" class="flex items-center gap-1.5 p-2 bg-white/[0.02] rounded-lg border border-white/5 text-[10px]">
                <span class="text-zinc-300 truncate">{{ getAssetDisplayName(rel.sourceAssetId) }}</span>
                <iconify-icon icon="solar:arrow-right-linear" width="10" class="text-zinc-600 flex-shrink-0"></iconify-icon>
                <span class="text-zinc-300 truncate">{{ getAssetDisplayName(rel.targetAssetId) }}</span>
                <span class="ml-auto text-zinc-600 flex-shrink-0 text-[9px]">{{ rel.relationType }}</span>
              </div>
              <p *ngIf="selectedAssetRelations.length === 0" class="text-[10px] text-zinc-600 text-center py-1">No relations</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="glass-panel p-4 space-y-2">
            <button (click)="analyzeImpact()" [disabled]="isAnalyzingImpact"
              class="w-full px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-brand font-semibold hover:bg-amber-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <iconify-icon icon="solar:danger-triangle-linear" width="14"></iconify-icon>
              {{ isAnalyzingImpact ? 'Analyzing...' : 'Analyze Impact' }}
            </button>
            <button *ngIf="hasHighlights" (click)="clearImpact()"
              class="w-full px-3 py-1.5 rounded-lg border border-white/10 text-zinc-400 text-[10px] font-brand hover:bg-white/5 transition-colors">
              Clear Impact Highlight
            </button>
            <a *ngIf="selectedAsset?.objectId" [routerLink]="['/app/objects', selectedAsset.objectId]"
              class="block w-full px-3 py-1.5 rounded-lg border border-white/10 text-zinc-400 text-[10px] font-brand hover:bg-white/5 transition-colors text-center">
              View Object Detail
            </a>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div *ngIf="viewMode === 'table'" class="grid grid-cols-12 gap-6">
        <!-- Assets List -->
        <div class="col-span-8">
          <div class="glass-panel overflow-hidden">
            <div class="p-4 border-b border-white/5 flex items-center justify-between">
              <p class="text-[10px] uppercase tracking-wider text-zinc-500">Mapped Objects ({{ assets.length }})</p>
              <div class="relative">
                <iconify-icon icon="solar:magnifer-linear" width="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600"></iconify-icon>
                <input type="text" [(ngModel)]="assetSearch" placeholder="Search assets..."
                  class="bg-zinc-900 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-zinc-300 placeholder-zinc-600 w-48 focus:border-white/20 focus:outline-none transition-colors" />
              </div>
            </div>
            <table class="w-full">
              <thead>
                <tr class="border-b border-white/5">
                  <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Name</th>
                  <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Type</th>
                  <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Criticality</th>
                  <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Description</th>
                  <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium">Relations</th>
                  <th class="text-right text-[10px] uppercase tracking-wider text-zinc-400 p-4 font-medium w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let asset of filteredTableAssets" class="border-b border-white/[0.06] table-row-hover">
                  <td class="p-4 text-sm text-zinc-200">
                    {{ asset.object?.name || asset.name }}
                    <span *ngIf="asset.object" class="ml-1.5 px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">linked</span>
                  </td>
                  <td class="p-4">
                    <span class="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800/50 text-zinc-400 text-[10px]">{{ asset.object?.type || asset.type }}</span>
                  </td>
                  <td class="p-4">
                    <span *ngIf="asset.criticality" class="px-2 py-0.5 rounded text-[10px]"
                      [ngClass]="{
                        'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20': asset.criticality === 'Low',
                        'bg-amber-500/10 text-amber-500 border border-amber-500/20': asset.criticality === 'Medium',
                        'bg-orange-500/10 text-orange-500 border border-orange-500/20': asset.criticality === 'High',
                        'bg-rose-500/10 text-rose-500 border border-rose-500/20': asset.criticality === 'Critical'
                      }">{{ asset.criticality }}</span>
                    <span *ngIf="!asset.criticality" class="text-zinc-600 text-[10px]">---</span>
                  </td>
                  <td class="p-4 text-xs text-zinc-400">{{ asset.object?.description || asset.description || '---' }}</td>
                  <td class="p-4 text-xs text-zinc-500 font-mono">{{ getRelationCount(asset.id) }}</td>
                  <td class="p-4 text-right">
                    <button (click)="removeAsset(asset.id, $event)"
                      class="p-1.5 rounded-lg hover:bg-rose-500/10 border border-rose-500/20 transition-colors flex items-center gap-1 ml-auto">
                      <iconify-icon icon="solar:trash-bin-trash-linear" width="14" class="text-rose-500"></iconify-icon>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="filteredTableAssets.length === 0">
                  <td colspan="6" class="p-8 text-center text-xs text-zinc-500">No assets found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Relations Panel -->
        <div class="col-span-4 space-y-4">
          <div class="glass-panel p-6">
            <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-4">Relations ({{ relations.length }})</p>
            <div class="space-y-2 max-h-96 overflow-y-auto">
              <div *ngFor="let rel of relations" class="flex items-center gap-2 p-2 bg-white/[0.02] rounded-lg border border-white/5 text-[10px]">
                <span class="text-zinc-300 truncate">{{ getAssetDisplayName(rel.sourceAssetId) }}</span>
                <iconify-icon icon="solar:arrow-right-linear" width="12" class="text-zinc-600 flex-shrink-0"></iconify-icon>
                <span class="text-zinc-300 truncate">{{ getAssetDisplayName(rel.targetAssetId) }}</span>
                <span class="ml-auto text-zinc-600 flex-shrink-0">{{ rel.relationType }}</span>
                <button (click)="removeRelation(rel.id)" class="p-0.5 rounded hover:bg-white/5 transition-colors flex-shrink-0">
                  <iconify-icon icon="solar:close-circle-linear" width="12" class="text-zinc-600 hover:text-rose-500"></iconify-icon>
                </button>
              </div>
              <p *ngIf="relations.length === 0" class="text-[10px] text-zinc-600 text-center py-2">No relations defined</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Object Modal -->
      <div *ngIf="showAssetModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="showAssetModal = false">
        <div class="glass-panel p-6 w-full max-w-lg space-y-4" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-brand font-bold text-white">Add Object to Cartography</h2>
            <button (click)="showAssetModal = false" class="p-1 rounded hover:bg-white/5 transition-colors">
              <iconify-icon icon="solar:close-circle-linear" width="20" class="text-zinc-500"></iconify-icon>
            </button>
          </div>

          <div class="relative">
            <iconify-icon icon="solar:magnifer-linear" width="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"></iconify-icon>
            <input type="text" [(ngModel)]="objectSearch" placeholder="Search existing objects..."
              class="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:border-white/20 focus:outline-none transition-colors" />
          </div>

          <div class="max-h-64 overflow-y-auto space-y-1">
            <div *ngFor="let obj of filteredAvailableObjects"
              (click)="addObjectToMap(obj)"
              class="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition-colors">
              <div>
                <p class="text-sm text-zinc-200">{{ obj.name }}</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="px-1.5 py-0.5 rounded text-[9px] border border-zinc-700 bg-zinc-800/50 text-zinc-400">{{ obj.type }}</span>
                  <span class="text-[10px] text-zinc-600">{{ obj.description || '' }}</span>
                </div>
              </div>
              <iconify-icon icon="solar:add-circle-linear" width="18" class="text-zinc-500"></iconify-icon>
            </div>
            <p *ngIf="filteredAvailableObjects.length === 0" class="text-[10px] text-zinc-600 text-center py-4">
              {{ allObjects.length === 0 ? 'No objects in the system' : 'All objects are already mapped' }}
            </p>
          </div>

          <div class="border-t border-white/5 pt-3">
            <p class="text-[10px] text-zinc-600 mb-2">Or create a standalone asset:</p>
            <div class="grid grid-cols-3 gap-3">
              <input type="text" [(ngModel)]="newAsset.name" placeholder="Asset name"
                class="bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:border-white/20 focus:outline-none transition-colors" />
              <select [(ngModel)]="newAsset.type"
                class="bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                <option *ngFor="let t of assetTypeOptions" [value]="t">{{ t }}</option>
              </select>
              <select [(ngModel)]="newAsset.criticality"
                class="bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                <option value="">No criticality</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <button (click)="createStandaloneAsset()" [disabled]="!newAsset.name.trim()"
              class="mt-2 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 font-brand hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              Create Standalone
            </button>
          </div>
        </div>
      </div>

      <!-- Create Relation Modal -->
      <div *ngIf="showRelationModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="showRelationModal = false">
        <div class="glass-panel p-6 w-full max-w-md space-y-4" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-brand font-bold text-white">Create Relation</h2>
            <button (click)="showRelationModal = false" class="p-1 rounded hover:bg-white/5 transition-colors">
              <iconify-icon icon="solar:close-circle-linear" width="20" class="text-zinc-500"></iconify-icon>
            </button>
          </div>
          <div class="space-y-3">
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Source</label>
              <select [(ngModel)]="newRelation.sourceAssetId"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                <option value="">Select source...</option>
                <option *ngFor="let a of assets" [value]="a.id">{{ getAssetDisplayName(a.id) }}</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Target</label>
              <select [(ngModel)]="newRelation.targetAssetId"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                <option value="">Select target...</option>
                <option *ngFor="let a of assets" [value]="a.id">{{ getAssetDisplayName(a.id) }}</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Relation Type</label>
              <select [(ngModel)]="newRelation.relationType"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                <option *ngFor="let t of relationTypeOptions" [value]="t">{{ formatRelationType(t) }}</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Label (optional)</label>
              <input type="text" [(ngModel)]="newRelation.label" placeholder="Display label..."
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:border-white/20 focus:outline-none transition-colors" />
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button (click)="showRelationModal = false"
              class="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400 font-brand hover:bg-white/5 transition-colors">Cancel</button>
            <button (click)="createRelation()"
              class="px-4 py-2 bg-white text-black rounded-lg text-sm font-brand font-semibold hover:bg-zinc-200 transition-colors">Create</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CartographyComponent implements OnInit, OnDestroy {
  @ViewChild('topologyGraph') topologyGraph!: TopologyGraphComponent;

  // Data
  assets: any[] = [];
  relations: any[] = [];
  allObjects: any[] = [];

  // View
  viewMode: 'graph' | 'table' = 'graph';
  currentLayout = 'cose';

  // Search
  assetSearch = '';
  objectSearch = '';
  graphSearch = '';

  // Modals
  showAssetModal = false;
  showRelationModal = false;
  newAsset = { name: '', type: 'Server', description: '', criticality: '' };
  newRelation = { sourceAssetId: '', targetAssetId: '', relationType: 'connects_to', label: '' };

  // Sidebar
  selectedAsset: any = null;
  selectedAssetScore: number | null = null;
  selectedAssetIncidents: any[] = [];
  selectedAssetRelations: any[] = [];
  hoveredNode: any = null;

  // Impact
  highlightedIds = new Set<string>();
  impactPaths: Record<string, string[]> = {};
  isAnalyzingImpact = false;
  hasHighlights = false;

  // Filters (cached)
  filters: any = {};

  // Options
  assetTypeOptions = ASSET_TYPES;
  relationTypeOptions = RELATION_TYPES;

  private subs: Subscription[] = [];

  constructor(private api: ApiService, private confirmService: ConfirmService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  private loadData(): void {
    const sub = this.api.getEnrichedTopology().subscribe({
      next: (data) => {
        this.assets = data.nodes || [];
        this.relations = data.edges || [];
        this.pushToGraph();
      },
      error: () => {
        // Fallback to basic endpoints
        this.api.getAssets().subscribe({
          next: (data) => { this.assets = data || []; this.pushToGraph(); },
          error: () => { this.assets = []; this.pushToGraph(); },
        });
        this.api.getRelations().subscribe({
          next: (data) => { this.relations = data || []; this.pushToGraph(); },
          error: () => { this.relations = []; this.pushToGraph(); },
        });
      },
    });
    this.subs.push(sub);

    const sub2 = this.api.getObjects().subscribe({
      next: (data) => { this.allObjects = data || []; },
      error: () => { this.allObjects = []; },
    });
    this.subs.push(sub2);
  }

  // --- Compute filtered data & push to graph imperatively ---

  private pushToGraph(): void {
    if (!this.topologyGraph) return;

    const nodes = this.computeFilteredNodes();
    const edges = this.computeFilteredEdges(nodes);

    this.topologyGraph.setData(nodes, edges);
    this.topologyGraph.setLayout(this.currentLayout);

    // Update sidebar relations if asset is selected
    if (this.selectedAsset) {
      this.selectedAssetRelations = this.relations.filter(
        (r: any) => r.sourceAssetId === this.selectedAsset.id || r.targetAssetId === this.selectedAsset.id,
      );
    }
  }

  private computeFilteredNodes(): any[] {
    let nodes = this.assets;

    if (this.filters.assetTypes?.length > 0) {
      const types = new Set(this.filters.assetTypes);
      nodes = nodes.filter((n: any) => types.has(n.object?.type || n.type));
    }

    if (this.filters.scoreMin != null) {
      nodes = nodes.filter((n: any) => (n.score ?? 0) >= this.filters.scoreMin);
    }
    if (this.filters.scoreMax != null) {
      nodes = nodes.filter((n: any) => (n.score ?? 100) <= this.filters.scoreMax);
    }

    if (this.filters.onlyWithIncidents) {
      nodes = nodes.filter((n: any) => (n.openIncidents || 0) > 0);
    }

    if (this.graphSearch) {
      const term = this.graphSearch.toLowerCase();
      nodes = nodes.filter((n: any) => {
        const name = n.object?.name || n.name || '';
        const type = n.object?.type || n.type || '';
        return name.toLowerCase().includes(term) || type.toLowerCase().includes(term);
      });
    }

    return nodes;
  }

  private computeFilteredEdges(nodes: any[]): any[] {
    const visibleIds = new Set(nodes.map((n: any) => n.id));
    let edges = this.relations.filter(
      (r: any) => visibleIds.has(r.sourceAssetId) && visibleIds.has(r.targetAssetId),
    );

    if (this.filters.relationTypes?.length > 0) {
      const types = new Set(this.filters.relationTypes);
      edges = edges.filter((e: any) => types.has(e.relationType));
    }

    return edges;
  }

  // Table view — this getter is fine, only used in table mode (no Cytoscape)
  get filteredTableAssets(): any[] {
    if (!this.assetSearch) return this.assets;
    const term = this.assetSearch.toLowerCase();
    return this.assets.filter((a: any) => {
      const name = a.object?.name || a.name || '';
      const type = a.object?.type || a.type || '';
      return name.toLowerCase().includes(term) || type.toLowerCase().includes(term);
    });
  }

  get filteredAvailableObjects(): any[] {
    const mappedObjectIds = new Set(
      this.assets.filter((a: any) => a.objectId).map((a: any) => a.objectId),
    );
    let available = this.allObjects.filter((obj: any) => !mappedObjectIds.has(obj.id));
    if (this.objectSearch) {
      const term = this.objectSearch.toLowerCase();
      available = available.filter((obj: any) =>
        obj.name?.toLowerCase().includes(term) || obj.type?.toLowerCase().includes(term),
      );
    }
    return available;
  }

  // --- Events ---

  onLayoutChange(layout: string): void {
    this.currentLayout = layout;
    this.topologyGraph?.setLayout(layout);
  }

  onFiltersChange(filters: any): void {
    this.filters = filters;
    this.pushToGraph();
  }

  onGraphSearchChange(term: string): void {
    this.graphSearch = term;
    this.pushToGraph();
  }

  onNodeSelected(assetId: string): void {
    this.selectedAsset = this.assets.find((a: any) => a.id === assetId) || null;
    this.selectedAssetScore = this.selectedAsset?.score ?? null;
    this.selectedAssetIncidents = [];
    this.selectedAssetRelations = this.selectedAsset
      ? this.relations.filter((r: any) => r.sourceAssetId === assetId || r.targetAssetId === assetId)
      : [];

    if (this.selectedAsset?.objectId) {
      this.api.getIncidents({ objectId: this.selectedAsset.objectId }).subscribe({
        next: (incidents) => {
          this.selectedAssetIncidents = (incidents || []).filter((i: any) => i.status === 'open');
        },
        error: () => {},
      });
    }
  }

  analyzeImpact(): void {
    if (!this.selectedAsset) return;
    this.isAnalyzingImpact = true;
    this.api.getImpactAnalysis(this.selectedAsset.id).subscribe({
      next: (result) => {
        this.highlightedIds = new Set(result.impactedAssetIds || []);
        this.impactPaths = result.paths || {};
        this.hasHighlights = this.highlightedIds.size > 0;
        this.isAnalyzingImpact = false;
        this.topologyGraph?.setHighlights(this.highlightedIds, this.impactPaths);
      },
      error: () => {
        this.isAnalyzingImpact = false;
      },
    });
  }

  clearImpact(): void {
    this.highlightedIds = new Set();
    this.impactPaths = {};
    this.hasHighlights = false;
    this.topologyGraph?.setHighlights(this.highlightedIds, this.impactPaths);
  }

  closeSidebar(): void {
    this.selectedAsset = null;
    this.selectedAssetRelations = [];
    this.clearImpact();
  }

  onFitView(): void {
    this.topologyGraph?.fitView();
  }

  onExportPng(): void {
    const dataUrl = this.topologyGraph?.exportPng();
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'topology-export.png';
    link.click();
  }

  // --- CRUD ---

  openAddAssetModal(): void {
    this.objectSearch = '';
    this.newAsset = { name: '', type: 'Server', description: '', criticality: '' };
    this.showAssetModal = true;
  }

  addObjectToMap(obj: any): void {
    const payload = {
      name: obj.name,
      type: obj.type,
      description: obj.description || null,
      objectId: obj.id,
    };
    this.api.createAsset(payload).subscribe({
      next: () => {
        this.showAssetModal = false;
        this.loadData();
      },
      error: (err: any) => console.error('[OSCI] Failed to add object to map:', err),
    });
  }

  createStandaloneAsset(): void {
    if (!this.newAsset.name.trim()) return;
    const payload: any = {
      name: this.newAsset.name,
      type: this.newAsset.type,
    };
    if (this.newAsset.description.trim()) {
      payload.description = this.newAsset.description;
    }
    if (this.newAsset.criticality) {
      payload.criticality = this.newAsset.criticality;
    }
    this.api.createAsset(payload).subscribe({
      next: () => {
        this.showAssetModal = false;
        this.newAsset = { name: '', type: 'Server', description: '', criticality: '' };
        this.loadData();
      },
      error: (err: any) => console.error('[OSCI] Failed to create asset:', err),
    });
  }

  async removeAsset(assetId: string, event: Event): Promise<void> {
    event.stopPropagation();
    const ok = await this.confirmService.confirm({
      title: 'Supprimer l\'asset',
      message: 'Retirer cet asset de la cartographie ?',
      confirmText: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    this.api.deleteAsset(assetId).subscribe({
      next: () => {
        if (this.selectedAsset?.id === assetId) {
          this.selectedAsset = null;
          this.selectedAssetRelations = [];
        }
        this.loadData();
      },
      error: (err: any) => console.error('[OSCI] Failed to remove asset:', err),
    });
  }

  removeRelation(relationId: string): void {
    this.api.deleteRelation(relationId).subscribe({
      next: () => this.loadData(),
      error: (err: any) => console.error('[OSCI] Failed to remove relation:', err),
    });
  }

  createRelation(): void {
    if (!this.newRelation.sourceAssetId || !this.newRelation.targetAssetId) return;
    const payload: any = {
      sourceAssetId: this.newRelation.sourceAssetId,
      targetAssetId: this.newRelation.targetAssetId,
      relationType: this.newRelation.relationType,
    };
    if (this.newRelation.label.trim()) {
      payload.label = this.newRelation.label;
    }
    this.api.createRelation(payload).subscribe({
      next: () => {
        this.showRelationModal = false;
        this.newRelation = { sourceAssetId: '', targetAssetId: '', relationType: 'connects_to', label: '' };
        this.loadData();
      },
      error: (err: any) => console.error('[OSCI] Failed to create relation:', err),
    });
  }

  // --- Helpers ---

  getRelationCount(assetId: string): number {
    return this.relations.filter((r: any) => r.sourceAssetId === assetId || r.targetAssetId === assetId).length;
  }

  getAssetDisplayName(id: string): string {
    const asset = this.assets.find((a: any) => a.id === id);
    if (!asset) return id;
    return asset.object?.name || asset.name || id;
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-rose-500';
  }

  formatRelationType(type: string): string {
    return type.replace(/_/g, ' ');
  }
}
