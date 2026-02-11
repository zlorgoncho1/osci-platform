import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router, private authService: AuthService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        switch (error.status) {
          case 401:
            if (req.headers.has('Authorization')) {
              if (typeof (this.authService as any)?.logout === 'function') {
                this.authService.logout();
              } else {
                console.warn(
                  '[OSCI] AuthService.logout unavailable; clearing tokens manually'
                );
                try {
                  sessionStorage.removeItem('access_token');
                  sessionStorage.removeItem('id_token');
                  sessionStorage.removeItem('refresh_token');
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('id_token');
                  localStorage.removeItem('refresh_token');
                } catch {}
              }
              this.router.navigate(['/login']);
            } else {
              console.warn(
                '[OSCI] 401 without Authorization header; skipping auto-logout',
                req.url
              );
            }
            break;
          case 403:
            console.error(
              '[OSCI] Access forbidden: insufficient permissions for',
              req.url
            );
            break;
          case 404:
            console.error('[OSCI] Resource not found:', req.url);
            break;
          case 500:
            console.error('[OSCI] Internal server error:', req.url);
            break;
          default:
            console.error(
              `[OSCI] HTTP error ${error.status}:`,
              error.message
            );
        }
        return throwError(() => error);
      })
    );
  }
}
