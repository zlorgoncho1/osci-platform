import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-incidents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-brand font-bold text-white">Incidents</h1>
          <p class="text-xs text-zinc-500 mt-1">Security incident tracking and response</p>
        </div>
        <button *ngIf="perm.canGlobal('incident', 'create')" (click)="showCreateModal = true"
          class="px-4 py-2 bg-white text-black rounded-lg text-sm font-brand font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2">
          <iconify-icon icon="solar:shield-warning-linear" width="16"></iconify-icon>
          Report Incident
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-4 gap-4">
        <div class="glass-panel p-4">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Open</p>
          <p class="text-2xl font-brand font-bold text-rose-500">{{ openCount }}</p>
        </div>
        <div class="glass-panel p-4">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Investigating</p>
          <p class="text-2xl font-brand font-bold text-amber-500">{{ investigatingCount }}</p>
        </div>
        <div class="glass-panel p-4">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Mitigated</p>
          <p class="text-2xl font-brand font-bold text-blue-500">{{ mitigatedCount }}</p>
        </div>
        <div class="glass-panel p-4">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Resolved</p>
          <p class="text-2xl font-brand font-bold text-emerald-500">{{ resolvedCount }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="glass-panel p-4 flex items-center gap-4">
        <div class="relative flex-1">
          <iconify-icon icon="solar:magnifer-linear" width="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"></iconify-icon>
          <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="filterIncidents()" placeholder="Search incidents..."
            class="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:border-white/20 focus:outline-none transition-colors" />
        </div>
        <select [(ngModel)]="filterSeverity" (ngModelChange)="filterIncidents()"
          class="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
          <option value="">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select [(ngModel)]="filterStatus" (ngModelChange)="filterIncidents()"
          class="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="mitigated">Mitigated</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <!-- Table -->
      <div class="glass-panel overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/5">
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Title</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Object</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Severity</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Status</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Reported</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let inc of filteredIncidents" class="border-b border-white/5 table-row-hover">
              <td class="p-4 text-sm text-zinc-300">{{ inc.title }}</td>
              <td class="p-4 text-xs text-zinc-400">{{ inc.objectName || inc.objectId || '---' }}</td>
              <td class="p-4">
                <span class="px-2 py-0.5 rounded text-[10px]"
                  [ngClass]="{
                    'bg-rose-500/15 border border-rose-500/20 text-rose-500': inc.severity === 'Critical',
                    'bg-amber-500/15 border border-amber-500/20 text-amber-500': inc.severity === 'High',
                    'bg-blue-500/15 border border-blue-500/20 text-blue-500': inc.severity === 'Medium',
                    'bg-zinc-500/15 border border-zinc-500/20 text-zinc-400': inc.severity === 'Low'
                  }">{{ inc.severity }}</span>
              </td>
              <td class="p-4">
                <span class="px-2 py-0.5 rounded text-[10px]"
                  [ngClass]="{
                    'bg-rose-500/10 border border-rose-500/20 text-rose-500': inc.status === 'open',
                    'bg-amber-500/10 border border-amber-500/20 text-amber-500': inc.status === 'investigating',
                    'bg-blue-500/10 border border-blue-500/20 text-blue-500': inc.status === 'mitigated',
                    'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500': inc.status === 'resolved'
                  }">{{ inc.status }}</span>
              </td>
              <td class="p-4 text-xs text-zinc-400 font-mono">{{ inc.createdAt | date:'yyyy-MM-dd HH:mm' }}</td>
              <td class="p-4">
                <select *ngIf="perm.canGlobal('incident', 'update')" [ngModel]="inc.status" (ngModelChange)="updateStatus(inc, $event)"
                  class="bg-zinc-900 border border-white/10 rounded px-2 py-1 text-[10px] text-zinc-400 focus:outline-none">
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="mitigated">Mitigated</option>
                  <option value="resolved">Resolved</option>
                </select>
                <span *ngIf="!perm.canGlobal('incident', 'update')" class="text-[10px] text-zinc-500">{{ inc.status }}</span>
              </td>
            </tr>
            <tr *ngIf="filteredIncidents.length === 0">
              <td colspan="6" class="p-8 text-center text-xs text-zinc-600">
                <iconify-icon icon="solar:shield-warning-linear" width="32" class="text-zinc-700 mb-2"></iconify-icon>
                <p>No incidents found</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Create Modal -->
      <div *ngIf="showCreateModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="showCreateModal = false">
        <div class="glass-panel p-6 w-full max-w-lg space-y-4" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-brand font-bold text-white">Report Incident</h2>
            <button (click)="showCreateModal = false" class="p-1 rounded hover:bg-white/5 transition-colors">
              <iconify-icon icon="solar:close-circle-linear" width="20" class="text-zinc-500"></iconify-icon>
            </button>
          </div>
          <div class="space-y-3">
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Title</label>
              <input type="text" [(ngModel)]="newIncident.title"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Type</label>
                <select [(ngModel)]="newIncident.type"
                  class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                  <option value="data_breach">Data Breach</option>
                  <option value="unauthorized_access">Unauthorized Access</option>
                  <option value="malware">Malware</option>
                  <option value="phishing">Phishing</option>
                  <option value="dos">Denial of Service</option>
                  <option value="misconfiguration">Misconfiguration</option>
                  <option value="vulnerability">Vulnerability</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Severity</label>
                <select [(ngModel)]="newIncident.severity"
                  class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Object</label>
                <select [(ngModel)]="newIncident.objectId"
                  class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                  <option value="">Select object...</option>
                  <option *ngFor="let obj of availableObjects" [value]="obj.id">{{ obj.name }}</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Occurred At</label>
                <input type="datetime-local" [(ngModel)]="newIncident.occurredAt"
                  class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
              </div>
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Notes</label>
              <textarea [(ngModel)]="newIncident.notes" rows="3"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors resize-none"></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button (click)="showCreateModal = false"
              class="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400 font-brand hover:bg-white/5 transition-colors">Cancel</button>
            <button (click)="createIncident()"
              class="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-brand font-semibold hover:bg-rose-600 transition-colors">Report</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class IncidentsComponent implements OnInit {
  incidents: any[] = [];
  filteredIncidents: any[] = [];
  availableObjects: any[] = [];
  searchTerm = '';
  filterSeverity = '';
  filterStatus = '';
  showCreateModal = false;
  newIncident = { title: '', type: 'other', severity: 'Medium', objectId: '', occurredAt: '', notes: '' };

  openCount = 0;
  investigatingCount = 0;
  mitigatedCount = 0;
  resolvedCount = 0;

  constructor(private api: ApiService, public perm: PermissionService) {}

  ngOnInit(): void {
    this.loadIncidents();
    this.api.getObjects().subscribe({
      next: (data) => { this.availableObjects = data || []; },
      error: () => {},
    });
  }

  loadIncidents(): void {
    this.api.getIncidents().subscribe({
      next: (data) => {
        this.incidents = data || [];
        this.calculateCounts();
        this.filterIncidents();
      },
      error: () => {
        this.incidents = [];
        this.filteredIncidents = [];
      },
    });
  }

  private calculateCounts(): void {
    this.openCount = this.incidents.filter((i: any) => i['status'] === 'open').length;
    this.investigatingCount = this.incidents.filter((i: any) => i['status'] === 'investigating').length;
    this.mitigatedCount = this.incidents.filter((i: any) => i['status'] === 'mitigated').length;
    this.resolvedCount = this.incidents.filter((i: any) => i['status'] === 'resolved').length;
  }

  filterIncidents(): void {
    this.filteredIncidents = this.incidents.filter((inc: any) => {
      const matchesSearch = !this.searchTerm ||
        inc['title']?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesSeverity = !this.filterSeverity || inc['severity'] === this.filterSeverity;
      const matchesStatus = !this.filterStatus || inc['status'] === this.filterStatus;
      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }

  createIncident(): void {
    if (!this.newIncident.title.trim()) return;
    if (!this.newIncident.objectId) return;

    const payload: any = {
      title: this.newIncident.title,
      type: this.newIncident.type,
      severity: this.newIncident.severity,
      objectId: this.newIncident.objectId,
      occurredAt: this.newIncident.occurredAt
        ? new Date(this.newIncident.occurredAt).toISOString()
        : new Date().toISOString(),
    };
    if (this.newIncident.notes.trim()) {
      payload.details = { notes: this.newIncident.notes };
    }

    this.api.createIncident(payload).subscribe({
      next: () => {
        this.showCreateModal = false;
        this.newIncident = { title: '', type: 'other', severity: 'Medium', objectId: '', occurredAt: '', notes: '' };
        this.loadIncidents();
      },
      error: (err) => console.error('[OSCI] Failed to create incident:', err),
    });
  }

  updateStatus(incident: any, newStatus: string): void {
    this.api.updateIncident(incident['id'], { status: newStatus }).subscribe({
      next: () => {
        incident['status'] = newStatus;
        this.calculateCounts();
      },
      error: (err) => console.error('[OSCI] Failed to update incident:', err),
    });
  }
}
