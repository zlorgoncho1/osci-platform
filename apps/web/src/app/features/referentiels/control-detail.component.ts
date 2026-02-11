import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-control-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="space-y-6" *ngIf="control">
      <!-- Back + Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a [routerLink]="['/app/referentiels', referentielId]" class="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <iconify-icon icon="solar:arrow-left-linear" width="18" class="text-zinc-500"></iconify-icon>
          </a>
          <div>
            <h1 class="text-2xl font-brand font-bold text-white">{{ control.code }}</h1>
            <p class="text-sm text-zinc-400 mt-0.5">{{ control.title }}</p>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div *ngIf="control.description" class="glass-panel p-6">
        <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Description</p>
        <p class="text-sm text-zinc-400 whitespace-pre-wrap">{{ control.description }}</p>
      </div>

      <!-- Mapped Checklist Items -->
      <div class="glass-panel overflow-hidden">
        <div class="p-4 border-b border-white/5">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500">Questions mappées</p>
          <p class="text-[10px] text-zinc-600 mt-0.5">Items de checklist qui référencent cette exigence</p>
        </div>
        <div class="p-4 space-y-2">
          <div *ngFor="let item of mappedItems" class="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5">
            <div>
              <p class="text-sm text-zinc-300">{{ item.question }}</p>
              <a [routerLink]="['/app/checklists', item.checklist?.id]" class="text-[10px] text-zinc-500 hover:text-zinc-300">
                {{ item.checklist?.title || 'Checklist' }}
              </a>
            </div>
            <span class="text-[10px] px-1.5 py-0.5 rounded border border-white/10 text-zinc-400">{{ item.itemType }}</span>
          </div>
          <p *ngIf="mappedItems.length === 0" class="text-[10px] text-zinc-600 text-center py-4">Aucune question mappée</p>
          <p class="text-[10px] text-zinc-600">Mappez depuis la page détail d'une checklist lors de l'édition d'un item.</p>
        </div>
      </div>
    </div>

    <div *ngIf="!control && !error" class="flex items-center justify-center py-20">
      <iconify-icon icon="solar:refresh-linear" width="24" class="text-zinc-600 animate-spin"></iconify-icon>
    </div>
    <div *ngIf="error" class="flex items-center justify-center py-20">
      <p class="text-sm text-zinc-400">{{ error }}</p>
    </div>
  `,
})
export class ControlDetailComponent implements OnInit {
  control: any = null;
  mappedItems: any[] = [];
  referentielId = '';
  controlId = '';
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
  ) {}

  ngOnInit(): void {
    this.referentielId = this.route.snapshot.paramMap.get('id') || '';
    this.controlId = this.route.snapshot.paramMap.get('controlId') || '';
    if (this.referentielId && this.controlId) this.load();
  }

  load(): void {
    this.api.getReferentielControl(this.referentielId, this.controlId).subscribe({
      next: (c) => {
        this.control = c;
        this.loadMappedItems();
      },
      error: () => {
        this.error = 'Control not found';
      },
    });
  }

  loadMappedItems(): void {
    this.api.getMappedChecklistItems(this.referentielId, this.controlId).subscribe({
      next: (items) => (this.mappedItems = items || []),
    });
  }
}
