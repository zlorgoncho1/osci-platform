import { Injectable, Injector } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  // Lazy-resolved to break circular dependency:
  // AuthInterceptor -> AuthService -> OAuthService -> HttpClient -> AuthInterceptor
  private authService: AuthService | null = null;

  constructor(private injector: Injector) {}

  private getAuthService(): AuthService {
    if (!this.authService) {
      this.authService = this.injector.get(AuthService);
    }
    return this.authService;
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const isApiRequest =
      req.url.startsWith(environment.apiUrl || '/api') ||
      req.url.startsWith('/api');

    if (!isApiRequest) {
      return next.handle(req);
    }

    // Skip auth for public endpoints to avoid circular token refresh
    const isPublicAuth =
      req.url.includes('/auth/login') || req.url.includes('/auth/refresh');
    if (isPublicAuth) {
      return next.handle(req);
    }

    const auth = this.getAuthService();
    const done = auth.isDoneLoading;
    const done$ = done && typeof done.then === 'function' ? from(done) : of(true);

    return done$.pipe(
      switchMap(() => from(auth.ensureValidToken())),
      switchMap((token: string | null) => {
        if (token) {
          req = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
          });
        }
        return next.handle(req);
      })
    );
  }
}
