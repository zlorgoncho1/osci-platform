import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="min-h-screen bg-[#020202] flex items-center justify-center bg-grid">
      <div class="glass-panel p-8 w-full max-w-md space-y-6">
        <div class="text-center space-y-2">
          <iconify-icon icon="solar:lock-password-bold" width="48" class="text-emerald-400"></iconify-icon>
          <h1 class="text-xl font-brand font-bold text-white">Change Your Password</h1>
          <p class="text-sm text-zinc-400">You must set a new password before continuing.</p>
        </div>

        <form (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="block text-sm text-zinc-400 mb-1">Current Password</label>
            <input
              type="password"
              [(ngModel)]="oldPassword"
              name="oldPassword"
              required
              class="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50 placeholder-zinc-600"
              placeholder="Enter current password" />
          </div>
          <div>
            <label class="block text-sm text-zinc-400 mb-1">New Password</label>
            <input
              type="password"
              [(ngModel)]="newPassword"
              name="newPassword"
              required
              minlength="8"
              class="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50 placeholder-zinc-600"
              placeholder="Min. 8 characters" />
          </div>
          <div>
            <label class="block text-sm text-zinc-400 mb-1">Confirm New Password</label>
            <input
              type="password"
              [(ngModel)]="confirmPassword"
              name="confirmPassword"
              required
              class="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50 placeholder-zinc-600"
              placeholder="Re-enter new password" />
          </div>

          <p *ngIf="errorMessage" class="text-sm text-red-400">{{ errorMessage }}</p>

          <button
            type="submit"
            [disabled]="loading || !oldPassword || !newPassword || !confirmPassword"
            class="w-full bg-emerald-600 text-white font-brand font-semibold py-2.5 rounded-lg hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Updating...' : 'Update Password' }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class ChangePasswordComponent {
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  errorMessage = '';

  constructor(private api: ApiService, private router: Router) {}

  submit(): void {
    this.errorMessage = '';

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    if (this.newPassword.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters';
      return;
    }

    this.loading = true;
    this.api.changePassword(this.oldPassword, this.newPassword).subscribe({
      next: () => {
        this.router.navigate(['/app/cockpit']);
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message || 'Failed to change password';
        this.loading = false;
      },
    });
  }
}
