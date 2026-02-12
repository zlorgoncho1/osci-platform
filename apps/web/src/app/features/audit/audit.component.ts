import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-brand font-bold text-white">Evidence & Audit</h1>
          <p class="text-xs text-zinc-500 mt-1">Immutable audit trail and evidence management</p>
        </div>
        <button *ngIf="activeTab === 'audit'" (click)="exportCsv()"
          class="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400 font-brand hover:bg-white/5 transition-colors flex items-center gap-2">
          <iconify-icon icon="solar:download-linear" width="16"></iconify-icon>
          Export CSV
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 border-b border-white/5">
        <button (click)="switchTab('evidence')"
          class="px-4 py-2.5 text-xs font-brand transition-colors relative"
          [class.text-white]="activeTab === 'evidence'"
          [class.text-zinc-500]="activeTab !== 'evidence'">
          <span class="flex items-center gap-2">
            <iconify-icon icon="solar:folder-with-files-linear" width="16"></iconify-icon>
            Evidence
            <span *ngIf="evidenceTotal > 0" class="px-1.5 py-0.5 rounded-full text-[9px] bg-white/5 text-zinc-400 font-mono">{{ evidenceTotal }}</span>
          </span>
          <span *ngIf="activeTab === 'evidence'" class="absolute bottom-0 left-0 right-0 h-px bg-white"></span>
        </button>
        <button (click)="switchTab('audit')"
          class="px-4 py-2.5 text-xs font-brand transition-colors relative"
          [class.text-white]="activeTab === 'audit'"
          [class.text-zinc-500]="activeTab !== 'audit'">
          <span class="flex items-center gap-2">
            <iconify-icon icon="solar:document-text-linear" width="16"></iconify-icon>
            Audit Logs
          </span>
          <span *ngIf="activeTab === 'audit'" class="absolute bottom-0 left-0 right-0 h-px bg-white"></span>
        </button>
      </div>

      <!-- ===== EVIDENCE TAB ===== -->
      <ng-container *ngIf="activeTab === 'evidence'">
        <!-- Evidence Filters -->
        <div class="glass-panel p-4 flex items-center gap-4 flex-wrap">
          <div class="relative flex-1 min-w-[200px]">
            <iconify-icon icon="solar:magnifer-linear" width="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"></iconify-icon>
            <input type="text" [(ngModel)]="evidenceFilters.search" (ngModelChange)="onEvidenceFilterChange()" placeholder="Search by filename..."
              class="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:border-white/20 focus:outline-none transition-colors" />
          </div>
          <select [(ngModel)]="evidenceFilters.objectId" (ngModelChange)="onEvidenceFilterChange()"
            class="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
            <option value="">All Objects</option>
            <option *ngFor="let obj of objectsList" [value]="obj.id">{{ obj.name || obj.id.substring(0, 8) }}</option>
          </select>
        </div>

        <!-- Evidence Table -->
        <div class="glass-panel overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="border-b border-white/5">
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Filename</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Date</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Object</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Size</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let ev of evidenceList" class="border-b border-white/5 table-row-hover">
                <td class="p-4 text-xs text-zinc-300 flex items-center gap-2">
                  <iconify-icon [icon]="getFileIcon(ev.mimeType)" width="16" class="text-zinc-500 shrink-0"></iconify-icon>
                  <span class="truncate max-w-[240px]">{{ ev.filename }}</span>
                </td>
                <td class="p-4 text-[11px] text-zinc-400 font-mono whitespace-nowrap">{{ ev.createdAt | date:'yyyy-MM-dd HH:mm' }}</td>
                <td class="p-4 text-xs">
                  <a *ngIf="ev.objectId" [routerLink]="['/app/objects', ev.objectId]"
                    class="text-zinc-400 hover:text-white transition-colors">
                    {{ ev.object?.name || ev.objectId.substring(0, 8) }}
                  </a>
                  <span *ngIf="!ev.objectId" class="text-zinc-600">---</span>
                </td>
                <td class="p-4 text-[11px] text-zinc-500 font-mono">{{ formatFileSize(ev.size) }}</td>
                <td class="p-4">
                  <button (click)="downloadEvidence(ev)"
                    class="px-2.5 py-1 rounded border border-white/10 text-[10px] text-zinc-400 font-brand hover:bg-white/5 transition-colors flex items-center gap-1.5">
                    <iconify-icon icon="solar:download-linear" width="14"></iconify-icon>
                    Download
                  </button>
                </td>
              </tr>
              <tr *ngIf="evidenceList.length === 0">
                <td colspan="5" class="p-8 text-center text-xs text-zinc-600">
                  <iconify-icon icon="solar:folder-with-files-linear" width="32" class="text-zinc-700 mb-2"></iconify-icon>
                  <p>No evidence documents found.</p>
                  <p class="text-[10px] text-zinc-700 mt-1">Evidence can be uploaded from object details or during a checklist run.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Evidence Pagination -->
        <div class="flex items-center justify-between" *ngIf="evidenceTotalPages > 1">
          <span class="text-[10px] text-zinc-600 font-mono">Page {{ evidencePage }} of {{ evidenceTotalPages }}</span>
          <div class="flex gap-2">
            <button (click)="goToEvidencePage(evidencePage - 1)" [disabled]="evidencePage <= 1"
              class="px-3 py-1 rounded border border-white/10 text-xs text-zinc-400 font-brand hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">Prev</button>
            <button (click)="goToEvidencePage(evidencePage + 1)" [disabled]="evidencePage >= evidenceTotalPages"
              class="px-3 py-1 rounded border border-white/10 text-xs text-zinc-400 font-brand hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">Next</button>
          </div>
        </div>
      </ng-container>

      <!-- ===== AUDIT TAB ===== -->
      <ng-container *ngIf="activeTab === 'audit'">
        <!-- Audit Filters -->
        <div class="glass-panel p-4 flex items-center gap-4 flex-wrap">
          <div class="relative flex-1 min-w-[200px]">
            <iconify-icon icon="solar:magnifer-linear" width="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"></iconify-icon>
            <input type="text" [(ngModel)]="filters.search" (ngModelChange)="loadLogs()" placeholder="Search audit logs..."
              class="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:border-white/20 focus:outline-none transition-colors" />
          </div>
          <select [(ngModel)]="filters.action" (ngModelChange)="loadLogs()"
            class="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="RUN_CHECKLIST">Run Checklist</option>
            <option value="UPLOAD_EVIDENCE">Upload Evidence</option>
          </select>
          <input type="date" [(ngModel)]="filters.dateFrom" (ngModelChange)="loadLogs()"
            class="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
          <input type="date" [(ngModel)]="filters.dateTo" (ngModelChange)="loadLogs()"
            class="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
        </div>

        <!-- Audit Table -->
        <div class="glass-panel overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="border-b border-white/5">
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Timestamp</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Action</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Actor</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Resource</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Decision</th>
                <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of logs" class="border-b border-white/5 table-row-hover">
                <td class="p-4 text-[11px] text-zinc-400 font-mono whitespace-nowrap">{{ log.createdAt | date:'yyyy-MM-dd HH:mm:ss' }}</td>
                <td class="p-4">
                  <span class="px-2 py-0.5 rounded text-[10px]"
                    [ngClass]="{
                      'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500': log.action === 'CREATE' || log.action === 'LOGIN',
                      'bg-blue-500/10 border border-blue-500/20 text-blue-500': log.action === 'UPDATE' || log.action === 'RUN_CHECKLIST',
                      'bg-rose-500/10 border border-rose-500/20 text-rose-500': log.action === 'DELETE',
                      'bg-amber-500/10 border border-amber-500/20 text-amber-500': log.action === 'UPLOAD_EVIDENCE',
                      'bg-zinc-500/10 border border-zinc-500/20 text-zinc-400': !isKnownAction(log.action)
                    }">{{ log.action }}</span>
                </td>
                <td class="p-4 text-xs text-zinc-300">{{ log.actorId || log.actor }}</td>
                <td class="p-4 text-xs text-zinc-400">{{ log.objectType }} {{ log.objectId ? '(' + log.objectId.substring(0, 8) + ')' : '' }}</td>
                <td class="p-4">
                  <span class="text-[10px]"
                    [ngClass]="log.decision === 'ALLOW' || log.decision === 'allow' ? 'text-emerald-500' : 'text-rose-500'">
                    {{ log.decision || '---' }}
                  </span>
                </td>
                <td class="p-4 text-[10px] text-zinc-600 font-mono max-w-[200px] truncate">{{ log.context != null ? (log.context | json) : '---' }}</td>
              </tr>
              <tr *ngIf="logs.length === 0">
                <td colspan="6" class="p-8 text-center text-xs text-zinc-600">
                  <iconify-icon icon="solar:document-text-linear" width="32" class="text-zinc-700 mb-2"></iconify-icon>
                  <p>No audit logs found.</p>
                  <p class="text-[10px] text-zinc-700 mt-1">Logs are created when you perform actions (create, update, delete, run checklists, etc.).</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Audit Pagination -->
        <div class="flex items-center justify-between" *ngIf="totalPages > 1">
          <span class="text-[10px] text-zinc-600 font-mono">Page {{ currentPage }} of {{ totalPages }}</span>
          <div class="flex gap-2">
            <button (click)="goToPage(currentPage - 1)" [disabled]="currentPage <= 1"
              class="px-3 py-1 rounded border border-white/10 text-xs text-zinc-400 font-brand hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">Prev</button>
            <button (click)="goToPage(currentPage + 1)" [disabled]="currentPage >= totalPages"
              class="px-3 py-1 rounded border border-white/10 text-xs text-zinc-400 font-brand hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">Next</button>
          </div>
        </div>
      </ng-container>
    </div>
  `,
})
export class AuditComponent implements OnInit {
  activeTab: 'evidence' | 'audit' = 'evidence';

  // Audit state
  logs: any[] = [];
  currentPage = 1;
  totalPages = 1;
  pageSize = 25;
  filters = { search: '', action: '', dateFrom: '', dateTo: '' };

  // Evidence state
  evidenceList: any[] = [];
  evidencePage = 1;
  evidenceTotalPages = 1;
  evidenceTotal = 0;
  evidencePageSize = 25;
  evidenceFilters = { search: '', objectId: '' };
  objectsList: any[] = [];

  private readonly knownActions = new Set([
    'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'RUN_CHECKLIST', 'UPLOAD_EVIDENCE',
  ]);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadEvidence();
    this.loadObjects();
    this.loadLogs();
  }

  switchTab(tab: 'evidence' | 'audit'): void {
    this.activeTab = tab;
  }

  // ---- Evidence ----

  loadEvidence(): void {
    const params: any = {
      page: this.evidencePage,
      limit: this.evidencePageSize,
    };
    if (this.evidenceFilters.search) params['search'] = this.evidenceFilters.search;
    if (this.evidenceFilters.objectId) params['objectId'] = this.evidenceFilters.objectId;

    this.api.getEvidenceList(params).subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.evidenceList = data;
          this.evidenceTotal = data.length;
          this.evidenceTotalPages = 1;
        } else {
          this.evidenceList = data?.data || [];
          this.evidenceTotal = data?.total || 0;
          this.evidenceTotalPages = data?.total ? Math.ceil(data.total / this.evidencePageSize) : 1;
        }
      },
      error: () => {
        this.evidenceList = [];
        this.evidenceTotal = 0;
        this.evidenceTotalPages = 1;
      },
    });
  }

  onEvidenceFilterChange(): void {
    this.evidencePage = 1;
    this.loadEvidence();
  }

  goToEvidencePage(page: number): void {
    if (page < 1 || page > this.evidenceTotalPages) return;
    this.evidencePage = page;
    this.loadEvidence();
  }

  loadObjects(): void {
    this.api.getObjects().subscribe({
      next: (data) => { this.objectsList = data || []; },
      error: () => { this.objectsList = []; },
    });
  }

  downloadEvidence(ev: any): void {
    this.api.downloadEvidence(ev.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = ev.filename || 'evidence';
        a.click();
        window.URL.revokeObjectURL(url);
      },
    });
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
  }

  getFileIcon(mimeType: string): string {
    if (!mimeType) return 'solar:file-linear';
    if (mimeType.startsWith('image/')) return 'solar:gallery-linear';
    if (mimeType === 'application/pdf') return 'solar:document-text-linear';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv'))
      return 'solar:chart-square-linear';
    if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed'))
      return 'solar:zip-file-linear';
    return 'solar:file-linear';
  }

  // ---- Audit ----

  isKnownAction(action: string): boolean {
    return this.knownActions.has(action);
  }

  loadLogs(): void {
    this.currentPage = 1;
    this._fetchLogs();
  }

  private _fetchLogs(): void {
    const params: any = {
      page: this.currentPage,
      limit: this.pageSize,
    };
    if (this.filters.action) params['action'] = this.filters.action;
    if (this.filters.dateFrom) params['startDate'] = this.filters.dateFrom;
    if (this.filters.dateTo) params['endDate'] = this.filters.dateTo;
    if (this.filters.search) params['search'] = this.filters.search;

    this.api.getAuditLogs(params).subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.logs = data;
          this.totalPages = 1;
        } else {
          this.logs = data?.['data'] || [];
          this.totalPages = data?.['total'] ? Math.ceil(data['total'] / this.pageSize) : 1;
        }
      },
      error: () => {
        this.logs = [];
        this.totalPages = 1;
      },
    });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this._fetchLogs();
  }

  exportCsv(): void {
    const params: any = {};
    if (this.filters.action) params['action'] = this.filters.action;
    if (this.filters.dateFrom) params['startDate'] = this.filters.dateFrom;
    if (this.filters.dateTo) params['endDate'] = this.filters.dateTo;
    if (this.filters.search) params['search'] = this.filters.search;

    this.api.getAuditLogs({ ...params, page: 1, limit: 10000 }).subscribe({
      next: (data) => {
        const rows = Array.isArray(data) ? data : (data?.['data'] || []);
        if (rows.length === 0) return;
        const headers = ['Timestamp', 'Action', 'Actor', 'Object Type', 'Object ID', 'Decision', 'Context'];
        const csvRows = rows.map((log: any) => [
          log['createdAt'],
          log['action'],
          log['actorId'] || log['actor'],
          log['objectType'] || '',
          log['objectId'] || '',
          log['decision'] || '',
          log['context'] ? JSON.stringify(log['context']) : '',
        ]);
        const csv = [headers.join(','), ...csvRows.map((r: any[]) => r.map((v: any) => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `osci-audit-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
    });
  }
}
