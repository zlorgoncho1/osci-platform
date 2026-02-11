import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export const ASSET_TYPES = [
  'Server', 'Database', 'Network', 'Firewall', 'Router', 'Switch',
  'Workstation', 'Application', 'Container', 'CloudService', 'Storage',
  'Pipeline', 'Cluster', 'AISystem', 'Tool', 'Codebase', 'Human',
  'DataAsset', 'Infrastructure', 'Project',
];

export const RELATION_TYPES = [
  'connects_to', 'depends_on', 'hosts', 'authenticates', 'stores_data',
  'contains', 'monitors', 'backs_up', 'replicates_to', 'routes_traffic_to',
];

@Component({
  selector: 'app-topology-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="flex items-center gap-2 flex-wrap">
      <!-- Layout buttons -->
      <div class="flex items-center gap-1 bg-zinc-900 rounded-lg border border-white/5 p-0.5">
        <button *ngFor="let l of layouts" (click)="layoutChange.emit(l.value)"
          [class.active-tab]="currentLayout === l.value"
          class="px-2.5 py-1.5 rounded-md text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
          [title]="l.label">
          <iconify-icon [icon]="l.icon" width="14"></iconify-icon>
        </button>
      </div>

      <!-- Filter: Asset types -->
      <div class="relative" (click)="showAssetTypeFilter = !showAssetTypeFilter">
        <button class="px-3 py-1.5 rounded-lg border border-white/10 text-[10px] text-zinc-400 hover:bg-white/5 transition-colors flex items-center gap-1.5">
          <iconify-icon icon="solar:filter-linear" width="12"></iconify-icon>
          Assets
          <span *ngIf="selectedAssetTypes.length > 0" class="px-1 py-0.5 rounded bg-white/10 text-[9px]">{{ selectedAssetTypes.length }}</span>
        </button>
        <div *ngIf="showAssetTypeFilter" (click)="$event.stopPropagation()"
          class="absolute top-full left-0 mt-1 z-50 glass-panel p-2 w-48 max-h-64 overflow-y-auto">
          <label *ngFor="let t of assetTypes" class="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 cursor-pointer">
            <input type="checkbox" [checked]="selectedAssetTypes.includes(t)" (change)="toggleAssetType(t)"
              class="rounded border-white/20 bg-zinc-900 text-emerald-500 focus:ring-0 focus:ring-offset-0 w-3 h-3" />
            <span class="text-[10px] text-zinc-300">{{ t }}</span>
          </label>
        </div>
      </div>

      <!-- Filter: Relation types -->
      <div class="relative" (click)="showRelationTypeFilter = !showRelationTypeFilter">
        <button class="px-3 py-1.5 rounded-lg border border-white/10 text-[10px] text-zinc-400 hover:bg-white/5 transition-colors flex items-center gap-1.5">
          <iconify-icon icon="solar:link-linear" width="12"></iconify-icon>
          Relations
          <span *ngIf="selectedRelationTypes.length > 0" class="px-1 py-0.5 rounded bg-white/10 text-[9px]">{{ selectedRelationTypes.length }}</span>
        </button>
        <div *ngIf="showRelationTypeFilter" (click)="$event.stopPropagation()"
          class="absolute top-full left-0 mt-1 z-50 glass-panel p-2 w-48 max-h-64 overflow-y-auto">
          <label *ngFor="let t of relationTypes" class="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 cursor-pointer">
            <input type="checkbox" [checked]="selectedRelationTypes.includes(t)" (change)="toggleRelationType(t)"
              class="rounded border-white/20 bg-zinc-900 text-emerald-500 focus:ring-0 focus:ring-offset-0 w-3 h-3" />
            <span class="text-[10px] text-zinc-300">{{ formatRelationType(t) }}</span>
          </label>
        </div>
      </div>

      <!-- Score range -->
      <div class="flex items-center gap-1">
        <span class="text-[10px] text-zinc-500">Score:</span>
        <input type="number" [(ngModel)]="scoreMin" (ngModelChange)="emitFilters()" min="0" max="100" placeholder="min"
          class="w-12 bg-zinc-900 border border-white/10 rounded px-1.5 py-1 text-[10px] text-zinc-300 focus:border-white/20 focus:outline-none" />
        <span class="text-zinc-600 text-[10px]">-</span>
        <input type="number" [(ngModel)]="scoreMax" (ngModelChange)="emitFilters()" min="0" max="100" placeholder="max"
          class="w-12 bg-zinc-900 border border-white/10 rounded px-1.5 py-1 text-[10px] text-zinc-300 focus:border-white/20 focus:outline-none" />
      </div>

      <!-- Incidents toggle -->
      <label class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
        <input type="checkbox" [(ngModel)]="onlyWithIncidents" (ngModelChange)="emitFilters()"
          class="rounded border-white/20 bg-zinc-900 text-rose-500 focus:ring-0 focus:ring-offset-0 w-3 h-3" />
        <span class="text-[10px] text-zinc-400">Incidents only</span>
      </label>

      <!-- Spacer -->
      <div class="flex-1"></div>

      <!-- Search -->
      <div class="relative">
        <iconify-icon icon="solar:magnifer-linear" width="12" class="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600"></iconify-icon>
        <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="searchChange.emit(searchTerm)" placeholder="Search..."
          class="bg-zinc-900 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-[10px] text-zinc-300 placeholder-zinc-600 w-36 focus:border-white/20 focus:outline-none transition-colors" />
      </div>

      <!-- Fit View -->
      <button (click)="fitView.emit()" title="Fit View"
        class="p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:bg-white/5 transition-colors">
        <iconify-icon icon="solar:maximize-linear" width="14"></iconify-icon>
      </button>

      <!-- Export PNG -->
      <button (click)="exportPng.emit()" title="Export PNG"
        class="p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:bg-white/5 transition-colors">
        <iconify-icon icon="solar:gallery-download-linear" width="14"></iconify-icon>
      </button>
    </div>
  `,
})
export class TopologyToolbarComponent {
  @Input() currentLayout = 'cose';
  @Output() layoutChange = new EventEmitter<string>();
  @Output() filtersChange = new EventEmitter<any>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() fitView = new EventEmitter<void>();
  @Output() exportPng = new EventEmitter<void>();

  assetTypes = ASSET_TYPES;
  relationTypes = RELATION_TYPES;

  layouts = [
    { value: 'cose', label: 'Force-Directed', icon: 'solar:atom-linear' },
    { value: 'breadthfirst', label: 'Hierarchical', icon: 'solar:sort-vertical-linear' },
    { value: 'circle', label: 'Circular', icon: 'solar:refresh-circle-linear' },
    { value: 'grid', label: 'Grid', icon: 'solar:widget-linear' },
    { value: 'concentric', label: 'Concentric', icon: 'solar:target-linear' },
  ];

  selectedAssetTypes: string[] = [];
  selectedRelationTypes: string[] = [];
  scoreMin: number | null = null;
  scoreMax: number | null = null;
  onlyWithIncidents = false;
  searchTerm = '';
  showAssetTypeFilter = false;
  showRelationTypeFilter = false;

  toggleAssetType(type: string): void {
    const idx = this.selectedAssetTypes.indexOf(type);
    if (idx >= 0) {
      this.selectedAssetTypes.splice(idx, 1);
    } else {
      this.selectedAssetTypes.push(type);
    }
    this.emitFilters();
  }

  toggleRelationType(type: string): void {
    const idx = this.selectedRelationTypes.indexOf(type);
    if (idx >= 0) {
      this.selectedRelationTypes.splice(idx, 1);
    } else {
      this.selectedRelationTypes.push(type);
    }
    this.emitFilters();
  }

  emitFilters(): void {
    this.filtersChange.emit({
      assetTypes: this.selectedAssetTypes,
      relationTypes: this.selectedRelationTypes,
      scoreMin: this.scoreMin,
      scoreMax: this.scoreMax,
      onlyWithIncidents: this.onlyWithIncidents,
    });
  }

  formatRelationType(type: string): string {
    return type.replace(/_/g, ' ');
  }
}
