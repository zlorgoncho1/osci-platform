import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { PermissionService } from '../../core/services/permission.service';

interface DomainScore {
  name: string;
  score: number;
}

interface TaskCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

@Component({
  selector: 'app-cockpit',
  standalone: true,
  imports: [CommonModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="space-y-6">
      <!-- Title -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-brand font-bold text-white">Security Cockpit</h1>
          <p class="text-xs text-zinc-400 mt-1">Real-time security posture overview
            <a routerLink="/app/docs/module-cockpit"
               class="inline-flex items-center gap-1 ml-3 text-zinc-600 hover:text-emerald-400 transition-colors">
              <iconify-icon icon="solar:book-2-linear" width="12"></iconify-icon>
              <span class="text-[10px]">Guide</span>
            </a>
          </p>
        </div>
        <span class="text-[10px] font-mono text-zinc-500">{{ now | date:'yyyy-MM-dd HH:mm:ss' }}</span>
      </div>

      <!-- Score cards row -->
      <div class="grid grid-cols-12 gap-6">
        <!-- Global Score -->
        <div class="col-span-4 glass-panel p-6">
          <p class="text-[10px] uppercase tracking-wider text-zinc-400 mb-4">Global Security Score</p>
          <div class="flex items-center justify-center">
            <div class="relative w-32 h-32">
              <svg class="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="8"/>
                <circle cx="60" cy="60" r="54" fill="none"
                  [attr.stroke]="getScoreColor(globalScore)"
                  stroke-width="8"
                  stroke-linecap="round"
                  [attr.stroke-dasharray]="339.292"
                  [attr.stroke-dashoffset]="339.292 * (1 - globalScore / 100)"/>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-3xl font-brand font-bold" [ngClass]="getScoreTextClass(globalScore)">{{ globalScore }}</span>
                <span class="text-[10px] text-zinc-400">/ 100</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Domain Scores -->
        <div class="col-span-8 glass-panel p-6">
          <p class="text-[10px] uppercase tracking-wider text-zinc-400 mb-4">Domain Breakdown</p>
          <div *ngIf="domainScores.length > 0" class="grid grid-cols-4 gap-3">
            <div *ngFor="let domain of domainScores" class="bg-white/[0.04] rounded-lg p-3 border border-white/[0.08]">
              <p class="text-[10px] text-zinc-400 mb-1">{{ domain.name }}</p>
              <p class="text-lg font-brand font-bold" [ngClass]="getScoreTextClass(domain.score)">{{ domain.score }}%</p>
              <div class="mt-2 h-1 bg-white/[0.07] rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500"
                  [ngClass]="getScoreBarClass(domain.score)"
                  [style.width.%]="domain.score"></div>
              </div>
            </div>
          </div>
          <div *ngIf="domainScores.length === 0" class="flex items-center justify-center py-8">
            <p class="text-xs text-zinc-500">No scoring data yet. Run a checklist to generate scores.</p>
          </div>
        </div>
      </div>

      <!-- Second row -->
      <div class="grid grid-cols-12 gap-6">
        <!-- Objects table -->
        <div *ngIf="perm.canGlobal('object', 'read')" class="col-span-8 glass-panel p-6">
          <div class="flex items-center justify-between mb-4">
            <p class="text-[10px] uppercase tracking-wider text-zinc-400">Monitored Objects</p>
            <a routerLink="/app/objects" class="text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors">View all &rarr;</a>
          </div>
          <table class="w-full">
            <thead>
              <tr class="border-b border-white/[0.08]">
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 pb-3 font-medium">Name</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 pb-3 font-medium">Type</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 pb-3 font-medium">Score</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let obj of objects" class="border-b border-white/[0.06] table-row-hover cursor-pointer">
                <td class="py-3 text-sm text-zinc-200">{{ obj.name }}</td>
                <td class="py-3">
                  <span class="px-2 py-0.5 rounded border border-zinc-600 bg-zinc-800/60 text-zinc-300 text-[10px]">{{ obj.type }}</span>
                </td>
                <td class="py-3 text-sm font-mono" [ngClass]="obj.score !== undefined ? getScoreTextClass(obj.score) : 'text-zinc-500'">{{ obj.score !== undefined ? obj.score + '%' : '—' }}</td>
                <td class="py-3">
                  <span class="w-2 h-2 rounded-full inline-block"
                    [ngClass]="obj.score === undefined ? 'bg-zinc-500' : obj.score >= 80 ? 'bg-emerald-500' : obj.score >= 40 ? 'bg-amber-500' : 'bg-rose-500'"></span>
                </td>
              </tr>
              <tr *ngIf="objects.length === 0">
                <td colspan="4" class="py-8 text-center text-xs text-zinc-500">No objects monitored yet</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Remediation Focus + Audit -->
        <div [ngClass]="perm.canGlobal('object', 'read') ? 'col-span-4' : 'col-span-12'" class="space-y-6">
          <!-- Remediation -->
          <div *ngIf="perm.canGlobal('task', 'read')" class="glass-panel p-6">
            <p class="text-[10px] uppercase tracking-wider text-zinc-400 mb-4">Remediation Focus</p>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-xs text-zinc-300">Critical</span>
                <span class="px-2 py-0.5 rounded text-[10px] bg-rose-500/15 border border-rose-500/25 text-rose-400">{{ taskCounts.critical }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-zinc-300">High</span>
                <span class="px-2 py-0.5 rounded text-[10px] bg-amber-500/15 border border-amber-500/25 text-amber-400">{{ taskCounts.high }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-zinc-300">Medium</span>
                <span class="px-2 py-0.5 rounded text-[10px] bg-blue-500/15 border border-blue-500/25 text-blue-400">{{ taskCounts.medium }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-zinc-300">Low</span>
                <span class="px-2 py-0.5 rounded text-[10px] bg-zinc-500/15 border border-zinc-500/25 text-zinc-300">{{ taskCounts.low }}</span>
              </div>
            </div>
            <a routerLink="/app/remediation" class="block mt-4 text-center text-xs text-zinc-400 hover:text-zinc-200 transition-colors">View Kanban &rarr;</a>
          </div>

          <!-- Active Projects -->
          <div *ngIf="perm.canGlobal('project', 'read')" class="glass-panel p-6">
            <div class="flex items-center justify-between mb-4">
              <p class="text-[10px] uppercase tracking-wider text-zinc-400">Active Projects</p>
              <a routerLink="/app/projects" class="text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors">View all &rarr;</a>
            </div>
            <div class="flex items-center gap-4 mb-4">
              <div class="flex-1 text-center">
                <p class="text-xl font-brand font-bold text-white">{{ activeProjectCount }}</p>
                <p class="text-[10px] text-zinc-500">Active</p>
              </div>
              <div class="w-px h-8 bg-white/[0.08]"></div>
              <div class="flex-1 text-center">
                <p class="text-xl font-brand font-bold text-emerald-500">{{ completedProjectCount }}</p>
                <p class="text-[10px] text-zinc-500">Completed</p>
              </div>
            </div>
            <div class="space-y-2">
              <div *ngFor="let p of topProjects" class="space-y-1">
                <div class="flex justify-between items-center">
                  <span class="text-xs text-zinc-300 truncate">{{ p.name }}</span>
                  <span class="text-[10px] font-mono text-zinc-400">{{ p._progress || 0 }}%</span>
                </div>
                <div class="h-1 bg-white/[0.07] rounded-full overflow-hidden">
                  <div class="h-full rounded-full bg-emerald-500 transition-all" [style.width.%]="p._progress || 0"></div>
                </div>
              </div>
              <div *ngIf="topProjects.length === 0" class="text-[10px] text-zinc-500 py-2 text-center">
                No active projects
              </div>
            </div>
          </div>

          <!-- Audit Log Stream -->
          <div *ngIf="perm.canGlobal('audit_log', 'read')" class="glass-panel p-6">
            <p class="text-[10px] uppercase tracking-wider text-zinc-400 mb-4">Audit Stream</p>
            <div class="space-y-2 max-h-48 overflow-y-auto">
              <div *ngFor="let log of auditLogs" class="text-[10px] font-mono text-zinc-500 py-1 border-b border-white/[0.06]">
                <span class="text-zinc-400">{{ log.createdAt | date:'HH:mm:ss' }}</span>
                <span class="text-zinc-300 ml-2">{{ log.action }}</span>
                <span class="text-zinc-500 ml-1">{{ log.actorId }}</span>
              </div>
              <div *ngIf="auditLogs.length === 0" class="text-[10px] text-zinc-500 py-2 text-center">
                No audit events yet
              </div>
            </div>
          </div>

          <!-- Documentation -->
          <a routerLink="/app/docs" class="glass-panel p-4 flex items-center gap-3 hover:border-emerald-500/30 transition-colors group">
            <iconify-icon icon="solar:book-2-linear" width="20" class="text-emerald-400"></iconify-icon>
            <div>
              <p class="text-xs font-brand text-white group-hover:text-emerald-400 transition-colors">Documentation</p>
              <p class="text-[10px] text-zinc-500">Guides et références de la plateforme</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  `,
})
export class CockpitComponent implements OnInit {
  now = new Date();
  globalScore = 0;
  domainScores: DomainScore[] = [];

  objects: any[] = [];
  taskCounts: TaskCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  auditLogs: any[] = [];
  activeProjectCount = 0;
  completedProjectCount = 0;
  topProjects: any[] = [];

  constructor(private api: ApiService, public perm: PermissionService) {}

  ngOnInit(): void {
    this.loadData();
    // Update clock every second
    setInterval(() => { this.now = new Date(); }, 1000);
  }

  private scoresByObjectId: Record<string, number> = {};

  private loadData(): void {
    this.api.getGlobalScore().subscribe({
      next: (data) => {
        if (data && data['globalScore'] !== undefined) {
          this.globalScore = Math.round(data['globalScore']);
        }
        // Extract domain breakdown from all scores
        const scores: any[] = data?.['scores'] || [];
        const domainMap: Record<string, { total: number; count: number }> = {};
        for (const s of scores) {
          // Map objectId -> score value for objects table
          this.scoresByObjectId[s.objectId] = s.value;
          // Aggregate domain breakdown
          const breakdown = s.breakdown || {};
          for (const [domain, value] of Object.entries(breakdown)) {
            if (!domainMap[domain]) {
              domainMap[domain] = { total: 0, count: 0 };
            }
            domainMap[domain].total += value as number;
            domainMap[domain].count += 1;
          }
        }
        this.domainScores = Object.entries(domainMap).map(([name, data]) => ({
          name: this.formatDomainName(name),
          score: Math.round(data.total / data.count),
        }));
        // Re-apply scores to already-loaded objects
        this.applyScoresToObjects();
      },
      error: () => {},
    });

    if (this.perm.canGlobal('object', 'read')) {
      this.api.getObjects().subscribe({
        next: (data) => {
          this.objects = (data || []).slice(0, 8);
          this.applyScoresToObjects();
        },
        error: () => {
          this.objects = [];
        },
      });
    }

    if (this.perm.canGlobal('task', 'read')) {
      this.api.getTasks().subscribe({
        next: (tasks) => {
          const all = tasks || [];
          this.taskCounts = {
            critical: all.filter((t: any) => t['priority'] === 'Critical').length,
            high: all.filter((t: any) => t['priority'] === 'High').length,
            medium: all.filter((t: any) => t['priority'] === 'Medium').length,
            low: all.filter((t: any) => t['priority'] === 'Low').length,
          };
        },
        error: () => {
          this.taskCounts = { critical: 0, high: 0, medium: 0, low: 0 };
        },
      });
    }

    if (this.perm.canGlobal('audit_log', 'read')) {
      this.api.getAuditLogs({ limit: 10 }).subscribe({
        next: (data) => {
          this.auditLogs = (Array.isArray(data) ? data : data?.['data'] || []).slice(0, 10);
        },
        error: () => {
          this.auditLogs = [];
        },
      });
    }

    if (this.perm.canGlobal('project', 'read')) {
      this.api.getProjects().subscribe({
      next: (projects) => {
        const all = projects || [];
        this.activeProjectCount = all.filter((p: any) => p.status === 'Active' || p.status === 'Planning' || p.status === 'OnHold').length;
        this.completedProjectCount = all.filter((p: any) => p.status === 'Completed').length;
        const active = all.filter((p: any) => p.status !== 'Completed' && p.status !== 'Cancelled').slice(0, 3);
        this.topProjects = active;
        for (const p of this.topProjects) {
          this.api.getProjectStats(p.id).subscribe({
            next: (stats) => { p._progress = stats.percentComplete || 0; },
            error: () => { p._progress = 0; },
          });
        }
      },
      error: () => {
        this.activeProjectCount = 0;
        this.completedProjectCount = 0;
        this.topProjects = [];
      },
    });
    } // end if canGlobal('project','read')
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    if (score >= 40) return '#F97316';
    return '#EF4444';
  }

  getScoreTextClass(score: number): string {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-rose-500';
  }

  getScoreBarClass(score: number): string {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-rose-500';
  }

  private applyScoresToObjects(): void {
    for (const obj of this.objects) {
      if (this.scoresByObjectId[obj.id] !== undefined) {
        obj.score = Math.round(this.scoresByObjectId[obj.id]);
      }
    }
  }

  private formatDomainName(domain: string): string {
    return domain
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s: string) => s.toUpperCase())
      .trim();
  }
}
