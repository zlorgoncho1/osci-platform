import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  private add(type: Toast['type'], message: string, description?: string, duration = 4000): void {
    const toast: Toast = {
      id: crypto.randomUUID(),
      type,
      message,
      description,
      duration,
    };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);
    setTimeout(() => this.remove(toast.id), duration);
  }

  success(message: string, description?: string): void {
    this.add('success', message, description);
  }

  error(message: string, description?: string): void {
    this.add('error', message, description, 6000);
  }

  warning(message: string, description?: string): void {
    this.add('warning', message, description, 5000);
  }

  info(message: string, description?: string): void {
    this.add('info', message, description);
  }

  remove(id: string): void {
    this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
  }
}
