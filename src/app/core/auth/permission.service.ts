import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PermissionAction {
  code: string;
  name: string;
}

export interface PermissionPage {
  code: string;
  name: string;
  route: string;
  actions: PermissionAction[];
}

export interface PermissionModule {
  code: string;
  name: string;
  icon: string;
  route: string;
  pages: PermissionPage[];
}

const PERMISSIONS_KEY = 'kogzio_permissions';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private http = inject(HttpClient);
  private readonly granted = signal<ReadonlySet<string>>(this.readStored());

  readonly permissions = computed(() => [...this.granted()]);

  /** True when the signed-in user holds the given module, page or function permission. */
  has(code: string): boolean {
    return this.granted().has(code);
  }

  hasAny(codes: string[]): boolean {
    return codes.some((code) => this.has(code));
  }

  set(codes: string[]) {
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(codes));
    this.granted.set(new Set(codes));
  }

  clear() {
    localStorage.removeItem(PERMISSIONS_KEY);
    this.granted.set(new Set());
  }

  /** Re-reads permissions from the API, e.g. after an admin changes the current user's roles. */
  refresh() {
    return this.http
      .get<string[]>(`${environment.apiBaseUrl}/auth/permissions/mine`)
      .pipe(tap((codes) => this.set(codes)));
  }

  getCatalog() {
    return this.http.get<PermissionModule[]>(`${environment.apiBaseUrl}/auth/permissions/catalog`);
  }

  private readStored(): ReadonlySet<string> {
    const raw = localStorage.getItem(PERMISSIONS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  }
}
