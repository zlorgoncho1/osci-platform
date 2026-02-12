import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ConfirmService } from '../../shared/components/confirm/confirm.service';
import { ScoreGaugeComponent } from '../../shared/components/score-gauge/score-gauge.component';

@Component({
  selector: 'app-object-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ScoreGaugeComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="space-y-6" *ngIf="object">
      <!-- Back + Actions -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a routerLink="/app/objects" class="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <iconify-icon icon="solar:arrow-left-linear" width="18" class="text-zinc-500"></iconify-icon>
          </a>
          <div>
            <h1 class="text-2xl font-brand font-bold text-white">{{ object.name }}</h1>
            <div class="flex items-center gap-3 mt-1">
              <span class="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800/50 text-zinc-400 text-[10px]">{{ object.type }}</span>
              <span class="px-2 py-0.5 rounded text-[10px]"
                [ngClass]="{
                  'bg-rose-500/10 border border-rose-500/20 text-rose-500': object.criticality === 'critical',
                  'bg-amber-500/10 border border-amber-500/20 text-amber-500': object.criticality === 'high',
                  'bg-blue-500/10 border border-blue-500/20 text-blue-500': object.criticality === 'medium',
                  'bg-zinc-500/10 border border-zinc-500/20 text-zinc-400': object.criticality === 'low'
                }">{{ object.criticality }}</span>
              <span class="text-[10px] text-zinc-600 font-mono">ID: {{ object.id }}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="isEditing = !isEditing"
            class="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 font-brand hover:bg-white/5 transition-colors flex items-center gap-2">
            <iconify-icon icon="solar:pen-linear" width="14"></iconify-icon>Edit
          </button>
          <button (click)="deleteObject()"
            class="px-3 py-1.5 rounded-lg border border-rose-500/20 text-xs text-rose-500 font-brand hover:bg-rose-500/10 transition-colors flex items-center gap-2">
            <iconify-icon icon="solar:trash-bin-trash-linear" width="14"></iconify-icon>Delete
          </button>
        </div>
      </div>

      <!-- Info + Score row -->
      <div class="grid grid-cols-12 gap-6">
        <!-- Object Info -->
        <div class="col-span-8 glass-panel p-6 space-y-4">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Object Information</p>

          <div *ngIf="!isEditing" class="space-y-3">
            <div>
              <p class="text-[10px] text-zinc-600 mb-0.5">Description</p>
              <p class="text-sm text-zinc-300">{{ object.description || 'No description provided' }}</p>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <p class="text-[10px] text-zinc-600 mb-0.5">Owner</p>
                <p class="text-sm text-zinc-300">{{ object.owner || '---' }}</p>
              </div>
              <div>
                <p class="text-[10px] text-zinc-600 mb-0.5">Created</p>
                <p class="text-sm text-zinc-300 font-mono">{{ object.createdAt | date:'yyyy-MM-dd' }}</p>
              </div>
              <div>
                <p class="text-[10px] text-zinc-600 mb-0.5">Last Updated</p>
                <p class="text-sm text-zinc-300 font-mono">{{ object.updatedAt | date:'yyyy-MM-dd' }}</p>
              </div>
            </div>
            <div *ngIf="object.metadata">
              <p class="text-[10px] text-zinc-600 mb-1">Metadata</p>
              <pre class="text-[11px] text-zinc-400 font-mono bg-zinc-900/50 rounded-lg p-3 overflow-x-auto border border-white/5">{{ object.metadata | json }}</pre>
            </div>
          </div>

          <div *ngIf="isEditing" class="space-y-3">
            <div>
              <label class="text-[10px] text-zinc-600 mb-0.5 block">Name</label>
              <input type="text" [(ngModel)]="editData.name"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
            </div>
            <div>
              <label class="text-[10px] text-zinc-600 mb-0.5 block">Description</label>
              <textarea [(ngModel)]="editData.description" rows="3"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors resize-none"></textarea>
            </div>
            <div class="flex gap-2">
              <button (click)="saveEdit()"
                class="px-4 py-2 bg-white text-black rounded-lg text-sm font-brand font-semibold hover:bg-zinc-200 transition-colors">Save</button>
              <button (click)="isEditing = false"
                class="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400 font-brand hover:bg-white/5 transition-colors">Cancel</button>
            </div>
          </div>
        </div>

        <!-- Score -->
        <div class="col-span-4 glass-panel p-6 flex flex-col items-center justify-center">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-4">Security Score</p>
          <app-score-gauge [score]="score?.value || 0" size="lg"></app-score-gauge>
          <button (click)="recomputeScore()"
            class="mt-4 px-3 py-1.5 rounded-lg border border-white/10 text-[10px] text-zinc-400 font-brand hover:bg-white/5 transition-colors flex items-center gap-1">
            <iconify-icon icon="solar:refresh-linear" width="12"></iconify-icon>Recompute
          </button>
        </div>
      </div>

      <!-- Evidence -->
      <div class="glass-panel p-6">
        <div class="flex items-center justify-between mb-4">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500">Evidence</p>
          <label class="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-2">
            <iconify-icon icon="solar:upload-linear" width="14"></iconify-icon>Upload
            <input type="file" class="hidden" (change)="uploadEvidence($event)" />
          </label>
        </div>
        <div class="space-y-2">
          <div *ngFor="let ev of evidenceList" class="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5">
            <div class="flex items-center gap-3">
              <iconify-icon icon="solar:file-linear" width="16" class="text-zinc-500"></iconify-icon>
              <div>
                <p class="text-sm text-zinc-300">{{ ev.filename }}</p>
                <p class="text-[10px] text-zinc-600 font-mono">{{ ev.createdAt | date:'yyyy-MM-dd HH:mm' }}</p>
              </div>
            </div>
            <button (click)="downloadEvidence(ev.id)" class="text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors">Download</button>
          </div>
          <p *ngIf="evidenceList.length === 0" class="text-[10px] text-zinc-600 text-center py-4">No evidence uploaded</p>
        </div>
      </div>

      <!-- Applicable Checklists -->
      <div class="glass-panel p-6" *ngIf="applicableChecklists.length > 0">
        <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-4">Applicable Checklists</p>
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/[0.08]">
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-3 font-medium">Checklist</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-3 font-medium">Domain</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-3 font-medium">Criticality</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-3 font-medium">Items</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let cl of applicableChecklists" class="border-b border-white/[0.06] table-row-hover">
              <td class="p-3">
                <a [routerLink]="['/app/checklists', cl.id]" class="text-sm text-zinc-200 hover:text-white transition-colors hover:underline">{{ cl.title }}</a>
              </td>
              <td class="p-3">
                <span class="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800/50 text-zinc-400 text-[10px]">{{ cl.domain }}</span>
              </td>
              <td class="p-3">
                <span class="px-2 py-0.5 rounded text-[10px]"
                  [ngClass]="{
                    'bg-rose-500/15 border border-rose-500/20 text-rose-500': cl.criticality === 'Critical',
                    'bg-amber-500/15 border border-amber-500/20 text-amber-500': cl.criticality === 'High',
                    'bg-blue-500/15 border border-blue-500/20 text-blue-500': cl.criticality === 'Medium',
                    'bg-zinc-500/15 border border-zinc-500/20 text-zinc-400': cl.criticality === 'Low'
                  }">{{ cl.criticality }}</span>
              </td>
              <td class="p-3 text-xs text-zinc-400 font-mono">{{ cl.items?.length || 0 }}</td>
              <td class="p-3">
                <button (click)="runChecklist(cl)"
                  class="px-3 py-1 rounded-lg border border-emerald-500/20 text-[10px] text-emerald-500 font-brand hover:bg-emerald-500/10 transition-colors flex items-center gap-1">
                  <iconify-icon icon="solar:play-linear" width="12"></iconify-icon>Run
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Recent Runs + Related Tasks -->
      <div class="grid grid-cols-12 gap-6">
        <!-- Checklist Runs -->
        <div class="col-span-6 glass-panel p-6">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-4">Recent Checklist Runs</p>
          <div class="space-y-2">
            <div *ngFor="let run of recentRuns" class="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5">
              <div>
                <p class="text-sm text-zinc-300">{{ run.checklistTitle || 'Checklist Run' }}</p>
                <p class="text-[10px] text-zinc-600 font-mono">{{ run.createdAt | date:'yyyy-MM-dd HH:mm' }}</p>
              </div>
              <span class="text-sm font-mono font-bold"
                [ngClass]="run.score >= 80 ? 'text-emerald-500' : run.score >= 60 ? 'text-amber-500' : 'text-rose-500'">
                {{ run.score !== null && run.score !== undefined ? (run.score | number:'1.0-0') + '%' : '---' }}
              </span>
            </div>
            <p *ngIf="recentRuns.length === 0" class="text-[10px] text-zinc-600 text-center py-4">No checklist runs yet</p>
          </div>
        </div>

        <!-- Related Tasks -->
        <div class="col-span-6 glass-panel p-6">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-4">Related Remediation Tasks</p>
          <div class="space-y-2">
            <div *ngFor="let task of relatedTasks" class="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5">
              <div>
                <p class="text-sm text-zinc-300">{{ task.title }}</p>
                <span class="text-[10px] px-1.5 py-0.5 rounded"
                  [ngClass]="{
                    'bg-rose-500/10 text-rose-500': task.priority === 'critical',
                    'bg-amber-500/10 text-amber-500': task.priority === 'high',
                    'bg-blue-500/10 text-blue-500': task.priority === 'medium',
                    'bg-zinc-500/10 text-zinc-400': task.priority === 'low'
                  }">{{ task.priority }}</span>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded border border-white/10 text-zinc-400">{{ task.status }}</span>
            </div>
            <p *ngIf="relatedTasks.length === 0" class="text-[10px] text-zinc-600 text-center py-4">No tasks found</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div *ngIf="!object && !loadError" class="flex items-center justify-center py-20">
      <div class="text-center space-y-3">
        <iconify-icon icon="solar:refresh-linear" width="24" class="text-zinc-600 animate-spin"></iconify-icon>
        <p class="text-xs text-zinc-600">Loading object...</p>
      </div>
    </div>

    <!-- Error state -->
    <div *ngIf="loadError" class="flex items-center justify-center py-20">
      <div class="text-center space-y-3">
        <iconify-icon icon="solar:danger-triangle-linear" width="32" class="text-rose-500"></iconify-icon>
        <p class="text-sm text-zinc-400">Object not found</p>
        <a routerLink="/app/objects" class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">&larr; Back to Objects</a>
      </div>
    </div>
  `,
})
export class ObjectDetailComponent implements OnInit {
  object: any = null;
  score: any = null;
  recentRuns: any[] = [];
  relatedTasks: any[] = [];
  evidenceList: any[] = [];
  applicableChecklists: any[] = [];
  isEditing = false;
  editData = { name: '', description: '' };
  loadError = false;

  private objectId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private confirmService: ConfirmService,
  ) {}

  ngOnInit(): void {
    this.objectId = this.route.snapshot.paramMap.get('id') || '';
    if (this.objectId) {
      this.loadObject();
    }
  }

  private loadObject(): void {
    this.api.getObject(this.objectId).subscribe({
      next: (data) => {
        this.object = data;
        this.editData = { name: data['name'], description: data['description'] || '' };
        this.loadRelatedData();
      },
      error: () => {
        this.loadError = true;
      },
    });
  }

  private loadRelatedData(): void {
    this.api.getObjectScore(this.objectId).subscribe({
      next: (data) => { this.score = data; },
      error: () => {},
    });

    this.api.getRunsByObject(this.objectId).subscribe({
      next: (data) => {
        this.recentRuns = (data || []).map((run: any) => ({
          ...run,
          checklistTitle: run.checklist?.title || 'Checklist Run',
        }));
      },
      error: () => {},
    });

    // Deduplicate tasks first, then load them
    this.api.deduplicateTasks(this.objectId).subscribe({
      next: () => {
        this.api.getTasks({ objectId: this.objectId }).subscribe({
          next: (data) => { this.relatedTasks = data || []; },
          error: () => {},
        });
      },
      error: () => {
        // Dedup failed, still load tasks
        this.api.getTasks({ objectId: this.objectId }).subscribe({
          next: (data) => { this.relatedTasks = data || []; },
          error: () => {},
        });
      },
    });

    this.api.getEvidenceList({ objectId: this.objectId }).subscribe({
      next: (data) => { this.evidenceList = data?.data || data || []; },
      error: () => {},
    });

    if (this.object?.type) {
      this.api.getChecklistsByObjectType(this.object.type).subscribe({
        next: (data) => { this.applicableChecklists = data || []; },
        error: () => {},
      });
    }
  }

  saveEdit(): void {
    this.api.updateObject(this.objectId, this.editData).subscribe({
      next: (data) => {
        this.object = { ...this.object, ...data };
        this.isEditing = false;
      },
      error: (err) => console.error('[OSCI] Failed to update:', err),
    });
  }

  async deleteObject(): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: 'Supprimer l\'objet',
      message: 'Supprimer cet objet ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    this.api.deleteObject(this.objectId).subscribe({
      next: () => { this.router.navigate(['/app/objects']); },
      error: (err) => console.error('[OSCI] Failed to delete:', err),
    });
  }

  recomputeScore(): void {
    this.api.computeScore(this.objectId).subscribe({
      next: (data) => { this.score = data; },
      error: (err) => console.error('[OSCI] Failed to recompute:', err),
    });
  }

  uploadEvidence(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.api.uploadEvidence(file, this.objectId).subscribe({
      next: () => {
        this.api.getEvidenceList({ objectId: this.objectId }).subscribe({
          next: (data) => { this.evidenceList = data?.data || data || []; },
        });
      },
      error: (err) => console.error('[OSCI] Failed to upload:', err),
    });
  }

  downloadEvidence(id: string): void {
    this.api.downloadEvidence(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'evidence';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('[OSCI] Failed to download:', err),
    });
  }

  runChecklist(cl: any): void {
    this.api.startChecklistRun(cl.id, { objectId: this.objectId }).subscribe({
      next: (res) => {
        const run = res?.runs?.length ? res.runs[0] : res;
        if (run?.id) {
          this.router.navigate(['/app/checklists', run.id, 'run']);
        }
      },
      error: (err) => console.error('[OSCI] Failed to start run:', err),
    });
  }
}
