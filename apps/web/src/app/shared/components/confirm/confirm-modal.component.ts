import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService, ConfirmOptions } from './confirm.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div *ngIf="state" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center"
      (click)="cancel()">
      <div class="glass-panel p-6 w-full max-w-sm space-y-4 animate-modal-in" (click)="$event.stopPropagation()">
        <!-- Icon + Title -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" [ngClass]="getIconBgClass()">
            <iconify-icon [icon]="getIcon()" width="20" [ngClass]="getIconColorClass()"></iconify-icon>
          </div>
          <h2 class="text-lg font-brand font-bold text-white">{{ state.title }}</h2>
        </div>

        <!-- Message -->
        <p class="text-sm text-zinc-400 leading-relaxed">{{ state.message }}</p>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-2">
          <button (click)="cancel()"
            class="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400 font-brand hover:bg-white/5 transition-colors">
            {{ state.cancelText }}
          </button>
          <button (click)="ok()"
            class="px-4 py-2 rounded-lg text-sm font-brand font-semibold transition-colors"
            [ngClass]="getConfirmBtnClass()">
            {{ state.confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes modal-in {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(8px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    .animate-modal-in {
      animation: modal-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `],
})
export class ConfirmModalComponent {
  state: any = null;

  constructor(private confirmService: ConfirmService) {
    this.confirmService.state$.subscribe(s => this.state = s);
  }

  ok(): void {
    this.confirmService.respond(true);
  }

  cancel(): void {
    this.confirmService.respond(false);
  }

  getIcon(): string {
    switch (this.state?.variant) {
      case 'danger': return 'solar:trash-bin-trash-bold';
      case 'warning': return 'solar:danger-triangle-bold';
      default: return 'solar:info-circle-bold';
    }
  }

  getIconBgClass(): string {
    switch (this.state?.variant) {
      case 'danger': return 'bg-rose-500/15';
      case 'warning': return 'bg-amber-500/15';
      default: return 'bg-blue-500/15';
    }
  }

  getIconColorClass(): string {
    switch (this.state?.variant) {
      case 'danger': return 'text-rose-500';
      case 'warning': return 'text-amber-500';
      default: return 'text-blue-500';
    }
  }

  getConfirmBtnClass(): string {
    switch (this.state?.variant) {
      case 'danger': return 'bg-rose-500 text-white hover:bg-rose-600';
      case 'warning': return 'bg-amber-500 text-black hover:bg-amber-600';
      default: return 'bg-white text-black hover:bg-zinc-200';
    }
  }
}
