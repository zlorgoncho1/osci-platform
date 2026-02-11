import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private stateSubject = new BehaviorSubject<ConfirmState | null>(null);
  state$ = this.stateSubject.asObservable();

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.stateSubject.next({
        ...options,
        confirmText: options.confirmText || 'Confirmer',
        cancelText: options.cancelText || 'Annuler',
        variant: options.variant || 'danger',
        resolve,
      });
    });
  }

  respond(value: boolean): void {
    const state = this.stateSubject.value;
    if (state) {
      state.resolve(value);
      this.stateSubject.next(null);
    }
  }
}
