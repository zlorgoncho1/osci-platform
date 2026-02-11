import { Injectable } from '@angular/core';
import { OAuthService, AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  /** Resolves when the initial discovery + token exchange is complete */
  readonly isDoneLoading: Promise<boolean>;

  constructor(private oauthService: OAuthService, private router: Router) {
    this.isDoneLoading = this.configure();
  }

  private configure(): Promise<boolean> {
    const authConfig: AuthConfig = {
      issuer: `${environment.keycloak.url}/realms/${environment.keycloak.realm}`,
      redirectUri: window.location.origin + '/app/cockpit',
      clientId: environment.keycloak.clientId,
      responseType: 'code',
      scope: 'openid profile email',
      showDebugInformation: false,
      requireHttps: false,
      postLogoutRedirectUri: window.location.origin + '/login',
    };

    this.oauthService.configure(authConfig);
    this.oauthService.setupAutomaticSilentRefresh();

    this.oauthService.events.subscribe(() => {
      this.isAuthenticatedSubject.next(this.oauthService.hasValidAccessToken());
    });

    return this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
      const loggedIn = this.oauthService.hasValidAccessToken();
      this.isAuthenticatedSubject.next(loggedIn);

      // Clean OIDC callback params (state, session_state, code, iss) from URL
      if (loggedIn && window.location.search) {
        const url = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', url);
      }

      return loggedIn;
    });
  }

  login(): void {
    this.oauthService.initCodeFlow();
  }

  logout(): void {
    this.oauthService.logOut();
  }

  async ensureValidToken(): Promise<string | null> {
    const accessToken = this.oauthService.getAccessToken();
    if (accessToken && this.oauthService.hasValidAccessToken()) {
      return accessToken;
    }

    const refreshToken = this.oauthService.getRefreshToken();
    if (refreshToken) {
      try {
        await this.oauthService.refreshToken();
        const refreshed = this.oauthService.getAccessToken();
        if (refreshed && this.oauthService.hasValidAccessToken()) {
          return refreshed;
        }
      } catch {
        // fall through to stored-token check
      }
    }

    return this.getStoredTokenIfValid();
  }

  private getStoredTokenIfValid(): string | null {
    const token =
      sessionStorage.getItem('access_token') ||
      localStorage.getItem('access_token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expMs = typeof payload?.exp === 'number' ? payload.exp * 1000 : 0;
      // 30s clock skew buffer
      if (expMs && expMs > Date.now() + 30000) {
        return token;
      }
    } catch {
      // fall through to cleanup
    }
    try {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('id_token');
      sessionStorage.removeItem('refresh_token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('id_token');
      localStorage.removeItem('refresh_token');
    } catch {}
    return null;
  }

  get token(): string | null {
    return this.oauthService.getAccessToken() || this.getStoredTokenIfValid();
  }

  get isLoggedIn(): boolean {
    return this.oauthService.hasValidAccessToken();
  }

  get userProfile(): any {
    const claims = this.oauthService.getIdentityClaims();
    return claims;
  }

  get userRoles(): string[] {
    const token = this.oauthService.getAccessToken();
    if (!token) return [];
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload['realm_access']?.roles || [];
    } catch {
      return [];
    }
  }

  hasRole(role: string): boolean {
    return this.userRoles.includes(role);
  }
}
