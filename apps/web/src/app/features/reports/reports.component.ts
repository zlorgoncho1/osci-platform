import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-brand font-bold text-white">Reports</h1>
          <p class="text-xs text-zinc-500 mt-1">Generate and manage compliance reports
            <a routerLink="/app/docs/module-reports"
               class="inline-flex items-center gap-1 ml-3 text-zinc-600 hover:text-emerald-400 transition-colors">
              <iconify-icon icon="solar:book-2-linear" width="12"></iconify-icon>
              <span class="text-[10px]">Guide</span>
            </a>
          </p>
        </div>
        <button *ngIf="perm.canGlobal('report', 'create')" (click)="showGenerateModal = true"
          class="px-4 py-2 bg-white text-black rounded-lg text-sm font-brand font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2">
          <iconify-icon icon="solar:document-add-linear" width="16"></iconify-icon>
          Generate Report
        </button>
      </div>

      <!-- Report type cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="glass-panel p-5 space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <iconify-icon icon="solar:chart-square-linear" width="20" class="text-emerald-500"></iconify-icon>
            </div>
            <div>
              <p class="text-sm text-zinc-200 font-medium">Compliance</p>
              <p class="text-[10px] text-zinc-500">Security posture summary</p>
            </div>
          </div>
          <button *ngIf="perm.canGlobal('report', 'create')" (click)="quickGenerate('compliance')"
            class="w-full px-3 py-1.5 rounded-lg border border-emerald-500/20 text-[10px] text-emerald-500 font-brand hover:bg-emerald-500/10 transition-colors">
            Quick Generate
          </button>
        </div>
        <div class="glass-panel p-5 space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <iconify-icon icon="solar:document-text-linear" width="20" class="text-blue-500"></iconify-icon>
            </div>
            <div>
              <p class="text-sm text-zinc-200 font-medium">Audit</p>
              <p class="text-[10px] text-zinc-500">Full audit trail export</p>
            </div>
          </div>
          <button *ngIf="perm.canGlobal('report', 'create')" (click)="quickGenerate('audit')"
            class="w-full px-3 py-1.5 rounded-lg border border-blue-500/20 text-[10px] text-blue-500 font-brand hover:bg-blue-500/10 transition-colors">
            Quick Generate
          </button>
        </div>
        <div class="glass-panel p-5 space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <iconify-icon icon="solar:presentation-graph-linear" width="20" class="text-purple-500"></iconify-icon>
            </div>
            <div>
              <p class="text-sm text-zinc-200 font-medium">Executive</p>
              <p class="text-[10px] text-zinc-500">High-level overview</p>
            </div>
          </div>
          <button *ngIf="perm.canGlobal('report', 'create')" (click)="quickGenerate('executive')"
            class="w-full px-3 py-1.5 rounded-lg border border-purple-500/20 text-[10px] text-purple-500 font-brand hover:bg-purple-500/10 transition-colors">
            Quick Generate
          </button>
        </div>
        <div class="glass-panel p-5 space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <iconify-icon icon="solar:document-code-linear" width="20" class="text-amber-500"></iconify-icon>
            </div>
            <div>
              <p class="text-sm text-zinc-200 font-medium">By Referentiel</p>
              <p class="text-[10px] text-zinc-500">Framework compliance</p>
            </div>
          </div>
          <button *ngIf="perm.canGlobal('report', 'create')" (click)="showReferentielReportModal = true"
            class="w-full px-3 py-1.5 rounded-lg border border-amber-500/20 text-[10px] text-amber-500 font-brand hover:bg-amber-500/10 transition-colors">
            Generate
          </button>
        </div>
      </div>

      <!-- Reports List -->
      <div class="glass-panel overflow-hidden">
        <div class="p-4 border-b border-white/5">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500">Generated Reports</p>
        </div>
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/5">
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Title</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Type</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Status</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Generated</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let report of reports" class="border-b border-white/5 table-row-hover">
              <td class="p-4 text-sm text-zinc-300">{{ report.title }}</td>
              <td class="p-4">
                <span class="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800/50 text-zinc-400 text-[10px]">{{ report.type }}</span>
              </td>
              <td class="p-4">
                <span class="px-2 py-0.5 rounded text-[10px]"
                  [ngClass]="{
                    'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500': (report.status || 'completed') === 'completed',
                    'bg-blue-500/10 border border-blue-500/20 text-blue-500': report.status === 'generating',
                    'bg-rose-500/10 border border-rose-500/20 text-rose-500': report.status === 'failed'
                  }">{{ report.status || 'completed' }}</span>
              </td>
              <td class="p-4 text-xs text-zinc-400 font-mono">{{ report.createdAt | date:'yyyy-MM-dd HH:mm' }}</td>
              <td class="p-4">
                <div class="flex gap-2">
                  <button *ngIf="report.id" (click)="viewReport(report.id)"
                    class="px-2 py-1 rounded text-[10px] text-zinc-400 font-brand hover:bg-white/5 transition-colors">View</button>
                  <button *ngIf="report.id && perm.canGlobal('report', 'export')" (click)="downloadReport(report)"
                    class="px-2 py-1 rounded text-[10px] text-zinc-400 font-brand hover:bg-white/5 transition-colors">Download</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="reports.length === 0">
              <td colspan="5" class="p-8 text-center text-xs text-zinc-600">
                <iconify-icon icon="solar:chart-square-linear" width="32" class="text-zinc-700 mb-2"></iconify-icon>
                <p>No reports generated yet</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Generate Modal -->
      <div *ngIf="showGenerateModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="showGenerateModal = false">
        <div class="glass-panel p-6 w-full max-w-md space-y-4" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-brand font-bold text-white">Generate Report</h2>
            <button (click)="showGenerateModal = false" class="p-1 rounded hover:bg-white/5 transition-colors">
              <iconify-icon icon="solar:close-circle-linear" width="20" class="text-zinc-500"></iconify-icon>
            </button>
          </div>
          <div class="space-y-3">
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Title</label>
              <input type="text" [(ngModel)]="newReport.title"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Type</label>
              <select [(ngModel)]="newReport.type"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                <option value="compliance">Compliance</option>
                <option value="audit">Audit</option>
                <option value="executive">Executive</option>
                <option value="compliance-by-referentiel">Compliance by Referentiel</option>
              </select>
            </div>
            <div *ngIf="newReport.type === 'compliance-by-referentiel'">
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Referentiel</label>
              <select [(ngModel)]="newReport.referentielId"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                <option value="" disabled>Select a referentiel...</option>
                <option *ngFor="let ref of referentiels" [value]="ref.id">{{ ref.name }} ({{ ref.code }})</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Period</label>
              <div class="grid grid-cols-2 gap-3">
                <input type="date" [(ngModel)]="newReport.periodFrom"
                  class="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
                <input type="date" [(ngModel)]="newReport.periodTo"
                  class="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button (click)="showGenerateModal = false"
              class="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400 font-brand hover:bg-white/5 transition-colors">Cancel</button>
            <button (click)="generateReport()"
              class="px-4 py-2 bg-white text-black rounded-lg text-sm font-brand font-semibold hover:bg-zinc-200 transition-colors">Generate</button>
          </div>
        </div>
      </div>

      <!-- View Report Modal -->
      <div *ngIf="showViewReportModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="showViewReportModal = false">
        <div class="glass-panel p-6 w-full max-w-4xl max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-brand font-bold text-white">{{ viewedReport?.title || 'Report' }}</h2>
            <button (click)="showViewReportModal = false" class="p-1 rounded hover:bg-white/5 transition-colors">
              <iconify-icon icon="solar:close-circle-linear" width="20" class="text-zinc-500"></iconify-icon>
            </button>
          </div>
          <div class="flex gap-2 mb-3">
            <span class="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800/50 text-zinc-400 text-[10px]">{{ viewedReport?.type || '-' }}</span>
            <span class="text-[10px] text-zinc-500">{{ viewedReport?.createdAt | date:'yyyy-MM-dd HH:mm' }}</span>
          </div>
          <div class="flex-1 overflow-auto rounded-lg bg-zinc-900/80 border border-white/10 p-4">
            <pre class="text-xs text-zinc-300 font-mono whitespace-pre-wrap break-words">{{ reportJsonPreview }}</pre>
          </div>
          <div class="flex justify-end gap-3 mt-4 pt-3 border-t border-white/5">
            <button *ngIf="viewedReport?.id" (click)="downloadReport(viewedReport); showViewReportModal = false"
              class="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400 font-brand hover:bg-white/5 transition-colors flex items-center gap-2">
              <iconify-icon icon="solar:download-linear" width="16"></iconify-icon>
              Download
            </button>
            <button (click)="showViewReportModal = false"
              class="px-4 py-2 bg-white text-black rounded-lg text-sm font-brand font-semibold hover:bg-zinc-200 transition-colors">Close</button>
          </div>
        </div>
      </div>

      <!-- Referentiel Report Modal -->
      <div *ngIf="showReferentielReportModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="showReferentielReportModal = false">
        <div class="glass-panel p-6 w-full max-w-md space-y-4" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-brand font-bold text-white">Compliance by Referentiel</h2>
            <button (click)="showReferentielReportModal = false" class="p-1 rounded hover:bg-white/5 transition-colors">
              <iconify-icon icon="solar:close-circle-linear" width="20" class="text-zinc-500"></iconify-icon>
            </button>
          </div>
          <div class="space-y-3">
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Title</label>
              <input type="text" [(ngModel)]="referentielReportTitle" placeholder="e.g. ISO 27001 Compliance Report"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Referentiel</label>
              <select [(ngModel)]="selectedReferentielId"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                <option value="" disabled>Select a referentiel...</option>
                <option *ngFor="let ref of referentiels" [value]="ref.id">{{ ref.name }} ({{ ref.code }})</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button (click)="showReferentielReportModal = false"
              class="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400 font-brand hover:bg-white/5 transition-colors">Cancel</button>
            <button (click)="generateReferentielReport()" [disabled]="!selectedReferentielId"
              class="px-4 py-2 bg-white text-black rounded-lg text-sm font-brand font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">Generate</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ReportsComponent implements OnInit {
  reports: any[] = [];
  referentiels: any[] = [];
  showGenerateModal = false;
  showReferentielReportModal = false;
  showViewReportModal = false;
  viewedReport: any = null;
  reportJsonPreview = '';
  newReport = { title: '', type: 'compliance', periodFrom: '', periodTo: '', referentielId: '' };
  referentielReportTitle = '';
  selectedReferentielId = '';

  constructor(private api: ApiService, public perm: PermissionService) {}

  ngOnInit(): void {
    this.loadReports();
    this.loadReferentiels();
  }

  loadReferentiels(): void {
    this.api.getReferentiels({ limit: 100 }).subscribe({
      next: (res) => {
        const data = res.data || res || [];
        this.referentiels = Array.isArray(data) ? data : [data];
      },
    });
  }

  loadReports(): void {
    this.api.getReports().subscribe({
      next: (data) => { this.reports = data || []; },
      error: () => { this.reports = []; },
    });
  }

  private buildReportPayload(title: string, type: string, periodFrom?: string, periodTo?: string, referentielId?: string): any {
    const payload: any = { title, type };
    payload.filters = payload.filters || {};
    if (periodFrom) payload.filters.periodFrom = periodFrom;
    if (periodTo) payload.filters.periodTo = periodTo;
    if (referentielId) payload.filters.referentielId = referentielId;
    return payload;
  }

  generateReferentielReport(): void {
    if (!this.selectedReferentielId) return;
    const title = this.referentielReportTitle.trim() || `Compliance by Referentiel - ${new Date().toISOString().split('T')[0]}`;
    const payload = this.buildReportPayload(title, 'compliance-by-referentiel', undefined, undefined, this.selectedReferentielId);
    this.api.generateReport(payload).subscribe({
      next: () => {
        this.showReferentielReportModal = false;
        this.referentielReportTitle = '';
        this.selectedReferentielId = '';
        this.loadReports();
      },
      error: (err) => console.error('[OSCI] Failed to generate report:', err),
    });
  }

  quickGenerate(type: string): void {
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const title = `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${now.toISOString().split('T')[0]}`;
    const payload = this.buildReportPayload(title, type, monthAgo.toISOString(), now.toISOString());
    this.api.generateReport(payload).subscribe({
      next: () => { this.loadReports(); },
      error: (err) => console.error('[OSCI] Failed to generate report:', err),
    });
  }

  generateReport(): void {
    if (!this.newReport.title.trim()) return;
    if (this.newReport.type === 'compliance-by-referentiel' && !this.newReport.referentielId) return;
    const payload = this.buildReportPayload(
      this.newReport.title,
      this.newReport.type,
      this.newReport.periodFrom || undefined,
      this.newReport.periodTo || undefined,
      this.newReport.referentielId || undefined,
    );
    this.api.generateReport(payload).subscribe({
      next: () => {
        this.showGenerateModal = false;
        this.newReport = { title: '', type: 'compliance', periodFrom: '', periodTo: '', referentielId: '' };
        this.loadReports();
      },
      error: (err) => console.error('[OSCI] Failed to generate report:', err),
    });
  }

  viewReport(id: string): void {
    this.api.getReport(id).subscribe({
      next: (data) => {
        this.viewedReport = data;
        const content = data?.content ?? data;
        this.reportJsonPreview = typeof content === 'object'
          ? JSON.stringify(content, null, 2)
          : String(content || 'No content');
        this.showViewReportModal = true;
      },
      error: (err) => console.error('[OSCI] Failed to load report:', err),
    });
  }

  downloadReport(report: any): void {
    this.api.downloadReport(report['id']).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report['title'] || 'report'}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('[OSCI] Failed to download report:', err),
    });
  }
}
