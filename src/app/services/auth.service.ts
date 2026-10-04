import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, defer, finalize, firstValueFrom, from, shareReplay, tap } from 'rxjs';
import { API_BASE_URL } from './api-base-url.token';
import { AuthenticatedUser, AuthTokenResponse, LoginCredentials } from './auth.models';

type AsyncLockManager = {
  request<T>(name: string, callback: (lock: Lock | null) => Promise<T>): Promise<T>;
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private accessToken: string | null = null;
  private refreshRequest: Observable<AuthTokenResponse> | null = null;
  private readonly authUrl: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    this.authUrl = `${apiBaseUrl.replace(/\/+$/, '')}/api/v1/auth`;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  login(credentials: LoginCredentials): Observable<AuthTokenResponse> {
    return this.http.post<AuthTokenResponse>(`${this.authUrl}/login`, credentials, {
      withCredentials: true
    }).pipe(tap(({ accessToken }) => this.setAccessToken(accessToken)));
  }

  refreshAccessToken(): Observable<AuthTokenResponse> {
    if (this.refreshRequest) {
      return this.refreshRequest;
    }

    this.refreshRequest = this.refreshWithCrossTabLock().pipe(
      tap(({ accessToken }) => this.setAccessToken(accessToken)),
      finalize(() => this.refreshRequest = null),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return this.refreshRequest;
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.authUrl}/logout`, null, {
      withCredentials: true
    }).pipe(tap(() => this.clearSession()));
  }

  getCurrentUser(): Observable<AuthenticatedUser> {
    return this.http.get<AuthenticatedUser>(`${this.authUrl}/me`);
  }

  clearSession(): void {
    this.accessToken = null;
  }

  private refreshWithCrossTabLock(): Observable<AuthTokenResponse> {
    return defer(() => from((async (): Promise<AuthTokenResponse> => {
      if (typeof navigator === 'undefined' || !navigator.locks) {
        return firstValueFrom(this.requestRefresh());
      }

      const lockManager = navigator.locks as unknown as AsyncLockManager;
      return lockManager.request<AuthTokenResponse>(
        'mini-game-app-auth-refresh',
        async () => firstValueFrom(this.requestRefresh())
      );
    })()));
  }

  private requestRefresh(): Observable<AuthTokenResponse> {
    return this.http.post<AuthTokenResponse>(`${this.authUrl}/refresh`, null, {
      withCredentials: true
    });
  }

  private setAccessToken(accessToken: string): void {
    this.accessToken = accessToken;
  }
}