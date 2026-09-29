import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface AppUser {
  id: number;
  username: string;
  displayName: string;
  email?: string | null;
  isActive: boolean;
  createdAtUtc: string;
  lastLoginAtUtc?: string | null;
  roleIds: number[];
  roleNames: string[];
}

export interface CreateUserRequest {
  username: string;
  displayName: string;
  email?: string | null;
  password: string;
  isActive: boolean;
  roleIds: number[];
}

export interface UpdateUserRequest {
  displayName: string;
  email?: string | null;
  isActive: boolean;
  roleIds: number[];
}

export interface AppRole {
  id: number;
  name: string;
  description?: string | null;
  isSystem: boolean;
  userCount: number;
  permissions: string[];
}

export interface SaveRoleRequest {
  name: string;
  description?: string | null;
  permissions: string[];
}

@Injectable({ providedIn: 'root' })
export class AdministrationService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/auth`;

  getUsers() {
    return this.http.get<AppUser[]>(`${this.base}/users`);
  }

  createUser(request: CreateUserRequest) {
    return this.http.post<AppUser>(`${this.base}/users`, request);
  }

  updateUser(id: number, request: UpdateUserRequest) {
    return this.http.put<void>(`${this.base}/users/${id}`, request);
  }

  resetPassword(id: number, newPassword: string) {
    return this.http.post<void>(`${this.base}/users/${id}/reset-password`, { newPassword });
  }

  deleteUser(id: number) {
    return this.http.delete<void>(`${this.base}/users/${id}`);
  }

  getRoles() {
    return this.http.get<AppRole[]>(`${this.base}/roles`);
  }

  createRole(request: SaveRoleRequest) {
    return this.http.post<AppRole>(`${this.base}/roles`, request);
  }

  updateRole(id: number, request: SaveRoleRequest) {
    return this.http.put<void>(`${this.base}/roles/${id}`, request);
  }

  deleteRole(id: number) {
    return this.http.delete<void>(`${this.base}/roles/${id}`);
  }
}
