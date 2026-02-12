import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="min-h-screen bg-[#020202] flex items-center justify-center bg-grid">
      <div class="glass-panel p-8 w-full max-w-md space-y-8">
        <!-- Logo -->
        <div class="text-center space-y-4">
          <img src="assets/logo/logo-white.png" alt="OSCI Platform" class="w-16 h-16 mx-auto object-contain" />
          <div>
            <h1 class="text-2xl font-brand font-bold text-white">OSCI Platform</h1>
            <p class="text-xs text-zinc-500 uppercase tracking-wider mt-1">Zero Trust Security IDP</p>
          </div>
        </div>

        <!-- Status indicators -->
        <div class="flex justify-center gap-6 text-[10px] font-mono text-zinc-600">
          <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>OIDC READY
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>MFA ENABLED
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>ENCRYPTED
          </span>
        </div>

        <!-- Local login form -->
        <form (ngSubmit)="loginLocal()" class="space-y-4">
          <div>
            <label class="block text-sm text-zinc-400 mb-1">Email</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              class="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50 placeholder-zinc-600"
              placeholder="you@example.com" />
          </div>
          <div>
            <label class="block text-sm text-zinc-400 mb-1">Password</label>
            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              class="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50 placeholder-zinc-600"
              placeholder="Enter your password" />
          </div>

          <p *ngIf="errorMessage" class="text-sm text-red-400">{{ errorMessage }}</p>

          <button
            type="submit"
            [disabled]="loading || !email || !password"
            class="w-full bg-emerald-600 text-white font-brand font-semibold py-2.5 rounded-lg hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <iconify-icon *ngIf="!loading" icon="solar:login-2-bold" width="18"></iconify-icon>
            <iconify-icon *ngIf="loading" icon="solar:refresh-circle-line-duotone" width="18" class="animate-spin"></iconify-icon>
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <!-- Separator -->
        <div class="flex items-center gap-4">
          <div class="flex-1 border-t border-white/10"></div>
          <span class="text-xs text-zinc-500 uppercase">or</span>
          <div class="flex-1 border-t border-white/10"></div>
        </div>

        <!-- SSO button -->
        <button
          (click)="loginSSO()"
          class="w-full bg-white text-black font-brand font-semibold py-3 rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
        >
          <iconify-icon icon="solar:key-minimalistic-square-linear" width="18"></iconify-icon>
          Authenticate with SSO
        </button>

        <p class="text-center text-[10px] text-zinc-600">Secured by OIDC PKCE + MFA</p>
      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/app/cockpit']);
    }
  }

  async loginLocal(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const result = await this.authService.loginWithCredentials(
        this.email,
        this.password,
      );

      if (result.mustChangePassword) {
        this.router.navigate(['/change-password']);
      } else {
        this.router.navigate(['/app/cockpit']);
      }
    } catch (err: any) {
      this.errorMessage =
        err?.error?.message || err?.message || 'Authentication failed';
    } finally {
      this.loading = false;
    }
  }

  loginSSO(): void {
    this.authService.loginSSO();
  }
}
