import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA,
  NgZone,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import cytoscape from 'cytoscape';

const ASSET_TYPE_COLORS: Record<string, string> = {
  Server: '#10B981',
  Database: '#6366F1',
  Network: '#3B82F6',
  Firewall: '#EF4444',
  Router: '#F59E0B',
  Switch: '#84CC16',
  Workstation: '#A855F7',
  Application: '#8B5CF6',
  Container: '#06B6D4',
  CloudService: '#0EA5E9',
  Storage: '#14B8A6',
  Pipeline: '#F97316',
  Cluster: '#EC4899',
  AISystem: '#D946EF',
  Tool: '#78716C',
  Codebase: '#A3E635',
  Human: '#FB923C',
  DataAsset: '#818CF8',
  Infrastructure: '#2DD4BF',
  Project: '#FCD34D',
};

const RELATION_STYLES: Record<string, { color: string; style: string }> = {
  depends_on: { color: '#EF4444', style: 'dashed' },
  connects_to: { color: '#3B82F6', style: 'solid' },
  hosts: { color: '#10B981', style: 'solid' },
  authenticates: { color: '#F59E0B', style: 'dashed' },
  stores_data: { color: '#6366F1', style: 'solid' },
  contains: { color: '#8B5CF6', style: 'solid' },
  monitors: { color: '#06B6D4', style: 'dashed' },
  backs_up: { color: '#14B8A6', style: 'dashed' },
  replicates_to: { color: '#F97316', style: 'dashed' },
  routes_traffic_to: { color: '#EC4899', style: 'solid' },
};

function getScoreBorderColor(score: number | null | undefined): string {
  if (score == null) return '#3F3F46';
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#F59E0B';
  if (score >= 40) return '#F97316';
  return '#EF4444';
}

@Component({
  selector: 'app-topology-graph',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #cyContainer class="w-full h-full bg-[#020202] rounded-lg relative overflow-hidden">
      <div *ngIf="isEmpty" class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <iconify-icon icon="solar:map-linear" width="48" class="text-zinc-700 mb-3"></iconify-icon>
          <p class="text-sm text-zinc-600">No assets to display</p>
          <p class="text-[10px] text-zinc-700 mt-1">Add assets to see the topology graph</p>
        </div>
      </div>
    </div>
  `,
})
export class TopologyGraphComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cyContainer', { static: true }) cyContainer!: ElementRef<HTMLElement>;

  @Output() nodeSelected = new EventEmitter<string>();
  @Output() nodeHovered = new EventEmitter<any | null>();

  isEmpty = true;

  private cy: cytoscape.Core | null = null;
  private currentLayout: any = null;
  private lastNodeIds = '';
  private lastEdgeIds = '';
  private lastLayoutName = '';

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    // Init Cytoscape outside Angular zone to avoid CD on every mouse event
    this.ngZone.runOutsideAngular(() => {
      this.initCytoscape();
    });
  }

  ngOnDestroy(): void {
    this.stopCurrentLayout();
    this.cy?.destroy();
    this.cy = null;
  }

  // --- Public imperative API (called by parent, no @Input) ---

  setData(nodes: any[], edges: any[]): void {
    const nodeIds = nodes.map((n) => n.id).sort().join(',');
    const edgeIds = edges.map((e) => e.id).sort().join(',');

    if (nodeIds === this.lastNodeIds && edgeIds === this.lastEdgeIds) return;
    this.lastNodeIds = nodeIds;
    this.lastEdgeIds = edgeIds;

    this.ngZone.runOutsideAngular(() => {
      this.updateElements(nodes, edges);
    });

    const wasEmpty = this.isEmpty;
    this.isEmpty = nodes.length === 0;
    if (wasEmpty !== this.isEmpty) this.cdr.markForCheck();
  }

  setHighlights(highlightedIds: Set<string>, impactPaths: Record<string, string[]>): void {
    this.ngZone.runOutsideAngular(() => {
      this.applyHighlights(highlightedIds, impactPaths);
    });
  }

  setLayout(layoutName: string): void {
    if (layoutName === this.lastLayoutName) return;
    this.lastLayoutName = layoutName;
    this.ngZone.runOutsideAngular(() => {
      this.runLayout(layoutName);
    });
  }

  fitView(): void {
    this.cy?.fit(undefined, 40);
  }

  exportPng(): string | null {
    if (!this.cy) return null;
    return this.cy.png({ full: true, scale: 2, bg: '#020202' } as any);
  }

  // --- Private ---

  private initCytoscape(): void {
    this.cy = cytoscape({
      container: this.cyContainer.nativeElement,
      elements: [],
      style: this.getCytoscapeStyle(),
      minZoom: 0.2,
      maxZoom: 4,
      wheelSensitivity: 0.3,
    });

    this.cy.on('tap', 'node', (evt) => {
      const nodeId = evt.target.id();
      // Re-enter zone only for explicit user clicks
      this.ngZone.run(() => this.nodeSelected.emit(nodeId));
    });

    this.cy.on('mouseover', 'node', (evt) => {
      const data = evt.target.data();
      // Run outside zone — parent uses OnPush so no CD storm
      this.ngZone.run(() => this.nodeHovered.emit(data));
    });

    this.cy.on('mouseout', 'node', () => {
      this.ngZone.run(() => this.nodeHovered.emit(null));
    });
  }

  private getCytoscapeStyle(): any[] {
    return [
      {
        selector: 'node',
        style: {
          'background-color': (ele: any) => ASSET_TYPE_COLORS[ele.data('type')] || '#71717A',
          'label': 'data(label)',
          'color': '#D4D4D8',
          'font-size': '10px',
          'font-family': 'Stack Sans Notch, Space Grotesk, sans-serif',
          'text-valign': 'bottom',
          'text-halign': 'center',
          'text-margin-y': 6,
          'text-outline-color': '#020202',
          'text-outline-width': 2,
          'width': (ele: any) => Math.min(30 + (ele.data('relationCount') || 0) * 5, 60),
          'height': (ele: any) => Math.min(30 + (ele.data('relationCount') || 0) * 5, 60),
          'border-width': 3,
          'border-color': (ele: any) => getScoreBorderColor(ele.data('score')),
          'overlay-opacity': 0,
        } as any,
      },
      {
        selector: 'node.has-incidents',
        style: {
          'overlay-color': '#EF4444',
          'overlay-opacity': 0.15,
          'overlay-padding': 8,
        } as any,
      },
      {
        selector: 'node.highlighted',
        style: {
          'border-color': '#F59E0B',
          'border-width': 4,
        } as any,
      },
      {
        selector: 'node:selected',
        style: {
          'border-color': '#FFFFFF',
          'border-width': 4,
        } as any,
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': (ele: any) => RELATION_STYLES[ele.data('relationType')]?.color || '#3F3F46',
          'line-style': (ele: any) => RELATION_STYLES[ele.data('relationType')]?.style || 'solid',
          'target-arrow-color': (ele: any) => RELATION_STYLES[ele.data('relationType')]?.color || '#3F3F46',
          'target-arrow-shape': 'triangle',
          'arrow-scale': 0.8,
          'curve-style': 'bezier',
          'label': 'data(relationType)',
          'font-size': '8px',
          'color': '#71717A',
          'text-rotation': 'autorotate',
          'text-outline-color': '#020202',
          'text-outline-width': 2,
          'text-margin-y': -8,
        } as any,
      },
      {
        selector: 'edge.impact-path',
        style: {
          'line-color': '#EF4444',
          'target-arrow-color': '#EF4444',
          'line-style': 'dashed',
          'width': 4,
          'z-index': 10,
        } as any,
      },
    ];
  }

  private updateElements(nodes: any[], edges: any[]): void {
    if (!this.cy) return;

    this.stopCurrentLayout();

    // Build relation count map
    const relationCounts = new Map<string, number>();
    for (const edge of edges) {
      const srcId = edge.sourceAssetId;
      const tgtId = edge.targetAssetId;
      relationCounts.set(srcId, (relationCounts.get(srcId) || 0) + 1);
      relationCounts.set(tgtId, (relationCounts.get(tgtId) || 0) + 1);
    }

    const cyNodes = nodes.map((node) => ({
      data: {
        id: node.id,
        label: node.object?.name || node.name,
        type: node.object?.type || node.type,
        name: node.object?.name || node.name,
        description: node.object?.description || node.description,
        objectId: node.objectId,
        criticality: node.criticality,
        score: node.score ?? null,
        openIncidents: node.openIncidents ?? 0,
        relationCount: relationCounts.get(node.id) || 0,
      },
    }));

    const cyEdges = edges.map((edge) => ({
      data: {
        id: edge.id,
        source: edge.sourceAssetId,
        target: edge.targetAssetId,
        relationType: edge.relationType,
        label: edge.label || edge.relationType,
      },
    }));

    this.cy.elements().remove();
    this.cy.add([...cyNodes, ...cyEdges] as any);

    // Apply incident class
    this.cy.nodes().forEach((node) => {
      if ((node.data('openIncidents') || 0) > 0) {
        node.addClass('has-incidents');
      }
    });

    this.runLayout(this.lastLayoutName || 'cose');
  }

  private applyHighlights(highlightedIds: Set<string>, impactPaths: Record<string, string[]>): void {
    if (!this.cy) return;

    this.cy.nodes().removeClass('highlighted');
    this.cy.edges().removeClass('impact-path');

    if (highlightedIds.size > 0) {
      this.cy.nodes().forEach((node) => {
        if (highlightedIds.has(node.id())) {
          node.addClass('highlighted');
        }
      });

      // Collect impacted edge pairs first, then iterate edges once
      const pairSet = new Set<string>();
      for (const path of Object.values(impactPaths)) {
        for (let i = 0; i < path.length - 1; i++) {
          pairSet.add(path[i] + '|' + path[i + 1]);
          pairSet.add(path[i + 1] + '|' + path[i]);
        }
      }
      if (pairSet.size > 0) {
        this.cy.edges().forEach((edge) => {
          const key = edge.data('source') + '|' + edge.data('target');
          if (pairSet.has(key)) {
            edge.addClass('impact-path');
          }
        });
      }
    }
  }

  private stopCurrentLayout(): void {
    if (this.currentLayout) {
      this.currentLayout.stop();
      this.currentLayout = null;
    }
  }

  private runLayout(layoutName: string): void {
    if (!this.cy || this.cy.nodes().length === 0) return;

    this.stopCurrentLayout();

    const layoutOptions: any = {
      name: layoutName,
      animate: true,
      animationDuration: 500,
      fit: true,
      padding: 40,
      stop: () => { this.currentLayout = null; },
    };

    if (layoutName === 'cose') {
      layoutOptions.nodeRepulsion = () => 8000;
      layoutOptions.idealEdgeLength = () => 120;
      layoutOptions.edgeElasticity = () => 100;
      layoutOptions.gravity = 0.3;
    }

    this.currentLayout = this.cy.layout(layoutOptions);
    this.currentLayout.run();
  }
}
