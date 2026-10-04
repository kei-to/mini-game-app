import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from './api-base-url.token';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private readonly authService: AuthService,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isApiRequest = this.isApiV1Request(request.url);
    const isAuthEndpoint = this.isAuthEndpoint(request.url);
    const outgoingRequest = isAuthEndpoint
      ? request.clone({ withCredentials: true })
      : this.withAccessToken(request);

    return next.handle(outgoingRequest).pipe(
      catchError((error: unknown) => {
        if (!(error instanceof HttpErrorResponse) || error.status !== 401 || !isApiRequest || isAuthEndpoint) {
          return throwError(() => error);
        }

        return this.authService.refreshAccessToken().pipe(
          switchMap(() => next.handle(this.withAccessToken(request))),
          catchError((refreshError: unknown) => {
            this.authService.clearSession();
            return throwError(() => refreshError);
          })
        );
      })
    );
  }

  private withAccessToken(request: HttpRequest<unknown>): HttpRequest<unknown> {
    const accessToken = this.authService.getAccessToken();
    if (!accessToken || !this.isApiV1Request(request.url)) {
      return request;
    }

    return request.clone({
      setHeaders: { Authorization: `Bearer ${accessToken}` }
    });
  }

  private isApiV1Request(url: string): boolean {
    const fallbackBaseUrl = 'http://localhost';
    const apiBaseUrl = this.apiBaseUrl || fallbackBaseUrl;
    const requestUrl = new URL(url, apiBaseUrl);
    const configuredApiUrl = new URL(apiBaseUrl, fallbackBaseUrl);

    return requestUrl.origin === configuredApiUrl.origin && requestUrl.pathname.startsWith('/api/v1/');
  }

  private isAuthEndpoint(url: string): boolean {
    const fallbackBaseUrl = 'http://localhost';
    const requestUrl = new URL(url, this.apiBaseUrl || fallbackBaseUrl);

    return /^\/api\/v1\/auth\/(login|refresh|logout)$/.test(requestUrl.pathname);
  }
}