import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
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

        <!-- Login button -->
        <button
          (click)="login()"
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
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/app/cockpit']);
    }
  }

  login(): void {
    this.authService.login();
  }
}
