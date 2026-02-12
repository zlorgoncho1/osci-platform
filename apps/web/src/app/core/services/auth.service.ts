import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OAuthService, AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  /** Resolves when the initial discovery + token exchange is complete */
  readonly isDoneLoading: Promise<boolean>;

  private _http?: HttpClient;

  constructor(
    private oauthService: OAuthService,
    private router: Router,
    private injector: Injector,
  ) {
    this.isDoneLoading = this.configure();
  }

  private get http(): HttpClient {
    if (!this._http) {
      this._http = this.injector.get(HttpClient);
    }
    return this._http;
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
      this.isAuthenticatedSubject.next(this.isLoggedIn);
    });

    return this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
      const loggedIn = this.isLoggedIn;
      this.isAuthenticatedSubject.next(loggedIn);

      // Clean OIDC callback params (state, session_state, code, iss) from URL
      if (loggedIn && window.location.search) {
        const url = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', url);
      }

      return loggedIn;
    }).catch(() => {
      // Keycloak unreachable — resolve gracefully so local auth still works
      this.isAuthenticatedSubject.next(this.isLoggedIn);
      return false;
    });
  }

  // --- SSO Login ---

  loginSSO(): void {
    this.oauthService.initCodeFlow();
  }

  /** @deprecated Use loginSSO() for SSO or loginWithCredentials() for local */
  login(): void {
    this.oauthService.initCodeFlow();
  }

  // --- Local Login ---

  async loginWithCredentials(
    email: string,
    password: string,
  ): Promise<{ mustChangePassword: boolean }> {
    const response = await firstValueFrom(
      this.http.post<{
        access_token: string;
        refresh_token: string;
        mustChangePassword: boolean;
      }>(`${environment.apiUrl}/auth/login`, { email, password }),
    );

    localStorage.setItem('local_access_token', response.access_token);
    localStorage.setItem('local_refresh_token', response.refresh_token);

    this.isAuthenticatedSubject.next(true);

    return { mustChangePassword: response.mustChangePassword };
  }

  // --- Logout ---

  logout(): void {
    // Clear local tokens
    localStorage.removeItem('local_access_token');
    localStorage.removeItem('local_refresh_token');

    // OAuth logout if OAuth was used
    if (this.oauthService.hasValidAccessToken()) {
      this.oauthService.logOut();
    } else {
      this.isAuthenticatedSubject.next(false);
      this.router.navigate(['/login']);
    }
  }

  // --- Token management ---

  async ensureValidToken(): Promise<string | null> {
    // 1. Try OAuth token
    const oauthToken = this.oauthService.getAccessToken();
    if (oauthToken && this.oauthService.hasValidAccessToken()) {
      return oauthToken;
    }

    // 2. Try OAuth refresh
    const oauthRefresh = this.oauthService.getRefreshToken();
    if (oauthRefresh) {
      try {
        await this.oauthService.refreshToken();
        const refreshed = this.oauthService.getAccessToken();
        if (refreshed && this.oauthService.hasValidAccessToken()) {
          return refreshed;
        }
      } catch {
        // fall through
      }
    }

    // 3. Try local access token
    const localToken = this.getLocalTokenIfValid();
    if (localToken) return localToken;

    // 4. Try local refresh
    const localRefresh = localStorage.getItem('local_refresh_token');
    if (localRefresh) {
      try {
        const response = await firstValueFrom(
          this.http.post<{ access_token: string }>(
            `${environment.apiUrl}/auth/refresh`,
            { refreshToken: localRefresh },
          ),
        );
        localStorage.setItem('local_access_token', response.access_token);
        return response.access_token;
      } catch {
        localStorage.removeItem('local_access_token');
        localStorage.removeItem('local_refresh_token');
      }
    }

    return null;
  }

  private getLocalTokenIfValid(): string | null {
    const token = localStorage.getItem('local_access_token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expMs = typeof payload?.exp === 'number' ? payload.exp * 1000 : 0;
      if (expMs && expMs > Date.now() + 30000) {
        return token;
      }
    } catch {
      // invalid token
    }
    localStorage.removeItem('local_access_token');
    return null;
  }

  get token(): string | null {
    return (
      this.oauthService.getAccessToken() ||
      this.getLocalTokenIfValid()
    );
  }

  get isLoggedIn(): boolean {
    return (
      this.oauthService.hasValidAccessToken() ||
      !!this.getLocalTokenIfValid()
    );
  }

  get userProfile(): any {
    const claims = this.oauthService.getIdentityClaims();
    return claims;
  }

  get userRoles(): string[] {
    const token = this.token;
    if (!token) return [];
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload['realm_access']?.roles || payload['roles'] || [];
    } catch {
      return [];
    }
  }

  hasRole(role: string): boolean {
    return this.userRoles.includes(role);
  }
}
