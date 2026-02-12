import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { PermissionService } from '../../core/services/permission.service';
import { ScoreGaugeComponent } from '../../shared/components/score-gauge/score-gauge.component';

@Component({
  selector: 'app-checklist-run',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ScoreGaugeComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="space-y-6" *ngIf="run">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a routerLink="/app/checklists" class="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <iconify-icon icon="solar:arrow-left-linear" width="18" class="text-zinc-500"></iconify-icon>
          </a>
          <div>
            <h1 class="text-2xl font-brand font-bold text-white">{{ run.checklistTitle || 'Checklist Run' }}</h1>
            <div class="flex items-center gap-3 mt-1">
              <span class="text-[10px] text-zinc-500 font-mono">Run ID: {{ run.id }}</span>
              <span class="px-2 py-0.5 rounded text-[10px]"
                [ngClass]="{
                  'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500': run.status === 'Completed',
                  'bg-blue-500/10 border border-blue-500/20 text-blue-500': run.status === 'InProgress',
                  'bg-zinc-500/10 border border-zinc-500/20 text-zinc-400': run.status !== 'Completed' && run.status !== 'InProgress'
                }">{{ run.status }}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <app-score-gauge [score]="runningScore" size="sm"></app-score-gauge>
          <button *ngIf="perm.canGlobal('checklist_run', 'update')" (click)="completeRun()" [disabled]="run.status === 'Completed'"
            class="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-brand font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            <iconify-icon icon="solar:check-circle-linear" width="16"></iconify-icon>Complete Run
          </button>
        </div>
      </div>

      <!-- Progress -->
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] uppercase tracking-wider text-zinc-500">Progress</span>
          <span class="text-xs text-zinc-400 font-mono">{{ answeredCount }} / {{ items.length }}</span>
        </div>
        <div class="h-2 bg-white/5 rounded-full overflow-hidden">
          <div class="h-full bg-emerald-500 rounded-full transition-all duration-500"
            [style.width.%]="items.length ? (answeredCount / items.length) * 100 : 0"></div>
        </div>
      </div>

      <!-- Items -->
      <div class="space-y-4">
        <div *ngFor="let item of items; let i = index" class="glass-panel p-6">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2 flex-wrap">
                <span class="text-[10px] text-zinc-600 font-mono">#{{ i + 1 }}</span>
                <span class="px-2 py-0.5 rounded text-[10px] border border-white/10 text-zinc-400">{{ item.type || 'yes_no' }}</span>
                <span *ngIf="item.weight" class="text-[10px] text-zinc-600 font-mono">Weight: {{ item.weight }}</span>
                <span *ngIf="item.controlCode" class="px-2 py-0.5 rounded text-[10px] bg-violet-500/10 border border-violet-500/20 text-violet-400 font-mono" [title]="item.controlTitle || ''">{{ item.controlCode }}</span>
                <span *ngIf="item.reference" class="text-[10px] text-zinc-600 font-mono truncate max-w-[200px]" [title]="item.reference">{{ item.reference }}</span>
              </div>
              <p class="text-sm text-zinc-200">{{ item.question }}</p>
              <p *ngIf="item.description" class="text-xs text-zinc-500 mt-1">{{ item.description }}</p>
            </div>
          </div>

          <!-- Yes/No answer type -->
          <div *ngIf="(item.type === 'yes_no' || item.type === 'YesNo' || !item.type) && perm.canGlobal('checklist_run', 'update')" class="flex gap-2">
            <button (click)="answerItem(item, 'yes')"
              class="px-4 py-2 rounded-lg text-sm font-brand transition-colors"
              [ngClass]="item.answer === 'yes' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'border border-white/10 text-zinc-400 hover:bg-white/5'">
              <iconify-icon icon="solar:check-circle-linear" width="14" class="mr-1"></iconify-icon>Yes
            </button>
            <button (click)="answerItem(item, 'no')"
              class="px-4 py-2 rounded-lg text-sm font-brand transition-colors"
              [ngClass]="item.answer === 'no' ? 'bg-rose-500/20 border border-rose-500/30 text-rose-400' : 'border border-white/10 text-zinc-400 hover:bg-white/5'">
              <iconify-icon icon="solar:close-circle-linear" width="14" class="mr-1"></iconify-icon>No
            </button>
            <button (click)="answerItem(item, 'na')"
              class="px-4 py-2 rounded-lg text-sm font-brand transition-colors"
              [ngClass]="item.answer === 'na' ? 'bg-zinc-500/20 border border-zinc-500/30 text-zinc-300' : 'border border-white/10 text-zinc-400 hover:bg-white/5'">
              N/A
            </button>
          </div>

          <!-- Score answer type -->
          <div *ngIf="(item.type === 'score' || item.type === 'Score') && perm.canGlobal('checklist_run', 'update')" class="space-y-2">
            <input type="range" [min]="0" [max]="100" [value]="item.scoreValue || 0"
              (input)="onScoreChange(item, $event)"
              class="w-full accent-emerald-500" />
            <div class="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>0</span>
              <span class="text-zinc-300">{{ item.scoreValue || 0 }}%</span>
              <span>100</span>
            </div>
          </div>

          <!-- Evidence answer type -->
          <div *ngIf="(item.type === 'evidence' || item.type === 'Evidence') && perm.canGlobal('checklist_run', 'update')" class="space-y-2">
            <label class="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-white/20 transition-colors">
              <iconify-icon icon="solar:upload-linear" width="18" class="text-zinc-500"></iconify-icon>
              <span class="text-xs text-zinc-400">{{ item.evidenceFile ? item.evidenceFile.name : 'Upload evidence file' }}</span>
              <input type="file" class="hidden" (change)="onEvidenceUpload(item, $event)" />
            </label>
            <div *ngIf="item.answer === 'uploaded'" class="flex items-center gap-2 text-[10px] text-emerald-500">
              <iconify-icon icon="solar:check-circle-linear" width="12"></iconify-icon>Evidence uploaded
            </div>
          </div>

          <!-- AutoCheck type -->
          <div *ngIf="item.type === 'auto_check' || item.type === 'AutoCheck'" class="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/5">
            <iconify-icon icon="solar:cpu-bolt-linear" width="18" class="text-purple-500"></iconify-icon>
            <div>
              <p class="text-xs text-zinc-400">Automated check</p>
              <p class="text-[10px] text-zinc-600 font-mono">{{ item.autoResult || 'Pending automated evaluation' }}</p>
            </div>
            <span *ngIf="item.answer" class="ml-auto px-2 py-0.5 rounded text-[10px]"
              [ngClass]="item.answer === 'pass' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'">
              {{ item.answer }}
            </span>
          </div>

          <!-- Notes -->
          <div class="mt-3" *ngIf="perm.canGlobal('checklist_run', 'update')">
            <textarea [(ngModel)]="item.notes" (blur)="saveItemNotes(item)" rows="2" placeholder="Add notes..."
              class="w-full bg-zinc-900/50 border border-white/5 rounded-lg px-3 py-2 text-[11px] text-zinc-400 placeholder-zinc-700 focus:border-white/10 focus:outline-none transition-colors resize-none"></textarea>
          </div>
        </div>
      </div>

      <!-- Bottom Complete Run -->
      <div *ngIf="items.length > 0" class="flex items-center justify-between glass-panel p-4">
        <div class="flex items-center gap-4">
          <app-score-gauge [score]="runningScore" size="sm"></app-score-gauge>
          <span class="text-xs text-zinc-400 font-mono">{{ answeredCount }} / {{ items.length }} answered</span>
        </div>
        <button *ngIf="perm.canGlobal('checklist_run', 'update')" (click)="completeRun()" [disabled]="run.status === 'Completed'"
          class="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-brand font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          <iconify-icon icon="solar:check-circle-linear" width="16"></iconify-icon>Complete Run
        </button>
      </div>

      <!-- Empty state -->
      <div *ngIf="items.length === 0" class="glass-panel p-8 text-center">
        <iconify-icon icon="solar:checklist-linear" width="32" class="text-zinc-700 mb-2"></iconify-icon>
        <p class="text-xs text-zinc-600">No items in this checklist run</p>
      </div>
    </div>

    <!-- Loading -->
    <div *ngIf="!run && !loadError" class="flex items-center justify-center py-20">
      <div class="text-center space-y-3">
        <iconify-icon icon="solar:refresh-linear" width="24" class="text-zinc-600 animate-spin"></iconify-icon>
        <p class="text-xs text-zinc-600">Loading checklist run...</p>
      </div>
    </div>

    <div *ngIf="loadError" class="flex items-center justify-center py-20">
      <div class="text-center space-y-3">
        <iconify-icon icon="solar:danger-triangle-linear" width="32" class="text-rose-500"></iconify-icon>
        <p class="text-sm text-zinc-400">Run not found</p>
        <a routerLink="/app/checklists" class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">&larr; Back to Checklists</a>
      </div>
    </div>
  `,
})
export class ChecklistRunComponent implements OnInit {
  run: any = null;
  items: any[] = [];
  runningScore = 0;
  answeredCount = 0;
  loadError = false;

  private runId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    public perm: PermissionService,
  ) {}

  ngOnInit(): void {
    this.runId = this.route.snapshot.paramMap.get('id') || '';
    if (this.runId) {
      this.loadRun();
    }
  }

  private loadRun(): void {
    this.api.getChecklistRun(this.runId).subscribe({
      next: (data) => {
        this.run = data;
        this.run['checklistTitle'] = data['checklist']?.['title'];
        this.items = (data['items'] || []).map((item: any) => {
          const ci = item['checklistItem'];
          const fc = ci?.['frameworkControl'];
          return {
            ...item,
            question: ci?.['question'] || item['question'] || '',
            type: ci?.['itemType'] || item['type'] || 'YesNo',
            weight: ci?.['weight'] || item['weight'] || 1,
            description: ci?.['expectedEvidence'] || '',
            reference: ci?.['reference'] || null,
            controlCode: fc?.['code'] || null,
            controlTitle: fc?.['title'] || null,
          };
        });
        this.calculateScore();
      },
      error: () => {
        this.loadError = true;
      },
    });
  }

  private calculateScore(): void {
    this.answeredCount = this.items.filter((i: any) => i['answer']).length;
    if (this.items.length === 0) {
      this.runningScore = 0;
      return;
    }
    const answeredItems = this.items.filter((i: any) => i['answer'] && i['answer'] !== 'na');
    if (answeredItems.length === 0) {
      this.runningScore = 0;
      return;
    }
    let totalWeight = 0;
    let earnedWeight = 0;
    for (const item of answeredItems) {
      const weight = item['weight'] || 1;
      totalWeight += weight;
      if (item['answer'] === 'yes' || item['answer'] === 'pass') {
        earnedWeight += weight;
      } else if (item['answer'] === 'uploaded') {
        earnedWeight += weight;
      } else if (item['scoreValue'] !== undefined) {
        earnedWeight += (item['scoreValue'] / 100) * weight;
      }
    }
    this.runningScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  }

  answerItem(item: any, answer: string): void {
    item['answer'] = answer;
    this.saveItem(item);
    this.calculateScore();
  }

  onScoreChange(item: any, event: Event): void {
    const value = +(event.target as HTMLInputElement).value;
    item['scoreValue'] = value;
    item['answer'] = 'scored';
    this.saveItem(item);
    this.calculateScore();
  }

  onEvidenceUpload(item: any, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    item['evidenceFile'] = file;
    this.api.uploadEvidence(file).subscribe({
      next: () => {
        item['answer'] = 'uploaded';
        this.saveItem(item);
        this.calculateScore();
      },
      error: (err) => console.error('[OSCI] Evidence upload failed:', err),
    });
  }

  saveItemNotes(item: any): void {
    this.saveItem(item);
  }

  private mapAnswerToStatus(answer: string): string | undefined {
    if (answer === 'yes' || answer === 'pass' || answer === 'uploaded') return 'Conformant';
    if (answer === 'no' || answer === 'fail') return 'NonConformant';
    if (answer === 'na') return 'NotApplicable';
    return undefined;
  }

  private saveItem(item: any): void {
    const payload: any = {
      answer: item['answer'],
      notes: item['notes'],
    };
    const status = this.mapAnswerToStatus(item['answer']);
    if (status) payload.status = status;
    if (item['scoreValue'] !== undefined) {
      payload.score = item['scoreValue'] / 100;
      payload.status = 'Conformant';
    }
    this.api.updateRunItem(this.runId, item['id'], payload).subscribe({
      error: (err) => console.error('[OSCI] Failed to save item:', err),
    });
  }

  completeRun(): void {
    if (!this.run) return;
    this.api.completeChecklistRun(this.runId).subscribe({
      next: () => {
        this.run['status'] = 'Completed';
      },
      error: (err) => console.error('[OSCI] Failed to complete run:', err),
    });
  }
}
