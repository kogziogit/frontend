import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CurrentUser, LoginResponse } from './auth.models';
import { PermissionService } from './permission.service';

const TOKEN_KEY = 'kogzio_token';
const REFRESH_TOKEN_KEY = 'kogzio_refresh_token';
const USER_KEY = 'kogzio_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly permissions = inject(PermissionService);
  private readonly tokenSignal = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly userSignal = signal<CurrentUser | null>(this.readStoredUser());
  private refreshInFlight$: Observable<LoginResponse> | null = null;

  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly currentUser = computed(() => this.userSignal());

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, { username, password }).pipe(
      tap((res) => this.storeSession(res))
    );
  }

  // Coalesces concurrent 401s into a single in-flight refresh call.
  refresh(): Observable<LoginResponse> {
    if (this.refreshInFlight$) return this.refreshInFlight$;

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    this.refreshInFlight$ = this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/refresh`, { refreshToken }).pipe(
      tap((res) => this.storeSession(res)),
      finalize(() => (this.refreshInFlight$ = null)),
      shareReplay(1)
    );
    return this.refreshInFlight$;
  }

  logout() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      this.http.post(`${environment.apiBaseUrl}/auth/logout`, { refreshToken }).subscribe({ error: () => {} });
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.permissions.clear();
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private storeSession(res: LoginResponse) {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    const user: CurrentUser = {
      username: res.username,
      displayName: res.displayName,
      role: res.role,
      roles: res.roles ?? [],
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.permissions.set(res.permissions ?? []);
    this.tokenSignal.set(res.token);
    this.userSignal.set(user);
  }

  private readStoredUser(): CurrentUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  }
}
