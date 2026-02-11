import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-topology-legend',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="glass-panel p-3 text-[9px] space-y-2 max-w-xs">
      <p class="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Legend</p>

      <!-- Asset Types -->
      <div>
        <p class="text-zinc-500 mb-1">Asset Types</p>
        <div class="grid grid-cols-2 gap-x-3 gap-y-0.5">
          <div *ngFor="let item of assetTypes" class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" [style.background]="item.color"></span>
            <span class="text-zinc-400">{{ item.label }}</span>
          </div>
        </div>
      </div>

      <!-- Relation Types -->
      <div>
        <p class="text-zinc-500 mb-1">Relations</p>
        <div class="grid grid-cols-2 gap-x-3 gap-y-0.5">
          <div *ngFor="let item of relationTypes" class="flex items-center gap-1.5">
            <span class="w-4 h-0.5 flex-shrink-0" [style.background]="item.color"
              [style.border-top]="item.dashed ? '2px dashed ' + item.color : 'none'"
              [style.background]="item.dashed ? 'transparent' : item.color"></span>
            <span class="text-zinc-400">{{ item.label }}</span>
          </div>
        </div>
      </div>

      <!-- Score Border -->
      <div>
        <p class="text-zinc-500 mb-1">Score Border</p>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1">
            <span class="w-2.5 h-2.5 rounded-full border-2 border-emerald-500"></span>
            <span class="text-zinc-400">&ge;80</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-2.5 h-2.5 rounded-full border-2 border-amber-500"></span>
            <span class="text-zinc-400">&ge;60</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-2.5 h-2.5 rounded-full border-2 border-orange-500"></span>
            <span class="text-zinc-400">&ge;40</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-2.5 h-2.5 rounded-full border-2 border-rose-500"></span>
            <span class="text-zinc-400">&lt;40</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TopologyLegendComponent {
  assetTypes = [
    { label: 'Server', color: '#10B981' },
    { label: 'Database', color: '#6366F1' },
    { label: 'Network', color: '#3B82F6' },
    { label: 'Firewall', color: '#EF4444' },
    { label: 'Router', color: '#F59E0B' },
    { label: 'Switch', color: '#84CC16' },
    { label: 'Application', color: '#8B5CF6' },
    { label: 'Container', color: '#06B6D4' },
    { label: 'CloudService', color: '#0EA5E9' },
    { label: 'Storage', color: '#14B8A6' },
    { label: 'Pipeline', color: '#F97316' },
    { label: 'Cluster', color: '#EC4899' },
    { label: 'AISystem', color: '#D946EF' },
    { label: 'Workstation', color: '#A855F7' },
  ];

  relationTypes = [
    { label: 'depends_on', color: '#EF4444', dashed: true },
    { label: 'connects_to', color: '#3B82F6', dashed: false },
    { label: 'hosts', color: '#10B981', dashed: false },
    { label: 'authenticates', color: '#F59E0B', dashed: true },
    { label: 'stores_data', color: '#6366F1', dashed: false },
    { label: 'contains', color: '#8B5CF6', dashed: false },
    { label: 'monitors', color: '#06B6D4', dashed: true },
    { label: 'backs_up', color: '#14B8A6', dashed: true },
    { label: 'replicates_to', color: '#F97316', dashed: true },
    { label: 'routes_traffic', color: '#EC4899', dashed: false },
  ];
}
