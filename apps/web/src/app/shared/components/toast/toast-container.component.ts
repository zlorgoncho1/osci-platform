import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="fixed bottom-6 right-6 z-[60] space-y-3 pointer-events-none">
      <div *ngFor="let toast of toasts; trackBy: trackById"
        class="pointer-events-auto w-80 rounded-xl border p-4 flex items-start gap-3 shadow-2xl backdrop-blur-xl animate-toast-in"
        [ngClass]="getContainerClass(toast.type)">
        <iconify-icon [icon]="getIcon(toast.type)" width="18" class="mt-0.5 shrink-0"
          [ngClass]="getIconClass(toast.type)"></iconify-icon>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-white">{{ toast.message }}</p>
          <p *ngIf="toast.description" class="text-xs text-zinc-400 mt-1">{{ toast.description }}</p>
        </div>
        <button (click)="dismiss(toast.id)" class="p-1 rounded hover:bg-white/10 transition-colors shrink-0">
          <iconify-icon icon="solar:close-circle-linear" width="16" class="text-zinc-500"></iconify-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateX(100%) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }
    .animate-toast-in {
      animation: toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `],
})
export class ToastContainerComponent {
  toasts: Toast[] = [];

  constructor(private toastService: ToastService) {
    this.toastService.toasts$.subscribe(t => this.toasts = t);
  }

  trackById(_: number, toast: Toast): string {
    return toast.id;
  }

  dismiss(id: string): void {
    this.toastService.remove(id);
  }

  getIcon(type: Toast['type']): string {
    switch (type) {
      case 'success': return 'solar:check-circle-bold';
      case 'error': return 'solar:close-circle-bold';
      case 'warning': return 'solar:danger-triangle-bold';
      case 'info': return 'solar:info-circle-bold';
    }
  }

  getIconClass(type: Toast['type']): string {
    switch (type) {
      case 'success': return 'text-emerald-500';
      case 'error': return 'text-rose-500';
      case 'warning': return 'text-amber-500';
      case 'info': return 'text-blue-500';
    }
  }

  getContainerClass(type: Toast['type']): string {
    switch (type) {
      case 'success': return 'bg-[#0C0C0E]/95 border-emerald-500/20';
      case 'error': return 'bg-[#0C0C0E]/95 border-rose-500/20';
      case 'warning': return 'bg-[#0C0C0E]/95 border-amber-500/20';
      case 'info': return 'bg-[#0C0C0E]/95 border-blue-500/20';
    }
  }
}
