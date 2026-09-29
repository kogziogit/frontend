import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { DataTable, TableColumn } from '../../../../shared/ui/data-table/data-table';
import { HasPermissionDirective } from '../../../../core/auth/has-permission.directive';
import { AdministrationService, AppRole, AppUser } from '../../services/administration.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

interface UserRow extends AppUser {
  rolesLabel: string;
  statusLabel: string;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeader, DataTable, HasPermissionDirective],
  template: `
    <app-page-header
      title="Users"
      subtitle="Create accounts and assign roles"
      [createLabel]="canCreate ? 'New User' : ''"
      (search)="onSearch($event)"
      (create)="openCreate()"
    />

    @if (loading) {
      <p>Loading users…</p>
    } @else if (error) {
      <p class="error">{{ error }}</p>
    } @else {
      <app-data-table [columns]="columns" [rows]="filteredRows" (edit)="openEdit($event)" (delete)="onDelete($event)" />
    }

    @if (showForm) {
      <div class="modal-backdrop" (click)="showForm = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <header class="modal__header">
            <h2>{{ editing ? 'Edit User' : 'New User' }}</h2>
            <button type="button" class="icon-btn" (click)="showForm = false">
              <span class="material-symbols-outlined">close</span>
            </button>
          </header>

          <div class="modal__body">
            <label>
              Username
              <input type="text" [(ngModel)]="form.username" [disabled]="!!editing" placeholder="jdoe" />
            </label>
            <label>
              Display Name
              <input type="text" [(ngModel)]="form.displayName" placeholder="Jane Doe" />
            </label>
            <label>
              Email
              <input type="email" [(ngModel)]="form.email" placeholder="jane@company.com" />
            </label>
            @if (!editing) {
              <label>
                Password
                <input type="password" [(ngModel)]="form.password" placeholder="Minimum 8 characters" />
              </label>
            }
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="form.isActive" />
              <span>Active (can sign in)</span>
            </label>

            <fieldset class="roles">
              <legend>Roles</legend>
              @for (role of roles; track role.id) {
                <label class="checkbox">
                  <input type="checkbox" [checked]="form.roleIds.includes(role.id)" (change)="toggleRole(role.id)" />
                  <span>
                    {{ role.name }}
                    @if (role.description) { <small>{{ role.description }}</small> }
                  </span>
                </label>
              } @empty {
                <p class="hint">No roles defined yet. Create one under Roles &amp; Permissions.</p>
              }
            </fieldset>
          </div>

          <footer class="modal__footer">
            @if (editing) {
              <button type="button" class="btn" *hasPermission="'administration.users.resetpassword'" (click)="openResetPassword()">
                Reset Password
              </button>
            }
            <span class="spacer"></span>
            <button type="button" class="btn" (click)="showForm = false">Cancel</button>
            <button type="button" class="btn btn--primary" (click)="save()">Save</button>
          </footer>
        </div>
      </div>
    }

    @if (showResetPassword) {
      <div class="modal-backdrop" (click)="showResetPassword = false">
        <div class="modal modal--sm" (click)="$event.stopPropagation()">
          <header class="modal__header"><h2>Reset Password</h2></header>
          <div class="modal__body">
            <p class="hint">Set a new password for <strong>{{ editing?.username }}</strong>.</p>
            <label>
              New Password
              <input type="password" [(ngModel)]="newPassword" placeholder="Minimum 8 characters" />
            </label>
          </div>
          <footer class="modal__footer">
            <span class="spacer"></span>
            <button type="button" class="btn" (click)="showResetPassword = false">Cancel</button>
            <button type="button" class="btn btn--primary" (click)="resetPassword()">Update</button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    .error { color: #c0392b; }
    .hint { color: #6b6b76; font-size: 12px; }
    .modal-backdrop { align-items: center; background: rgba(20, 20, 30, 0.45); display: flex; inset: 0; justify-content: center; position: fixed; z-index: 50; }
    .modal { background: #fff; border-radius: 10px; box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22); display: flex; flex-direction: column; max-height: 90vh; width: min(560px, 94vw); }
    .modal--sm { width: min(400px, 94vw); }
    .modal__header { align-items: center; border-bottom: 1px solid #ececf1; display: flex; justify-content: space-between; padding: 14px 18px; }
    .modal__header h2 { font-size: 16px; margin: 0; }
    .modal__body { display: flex; flex-direction: column; gap: 12px; overflow-y: auto; padding: 18px; }
    .modal__body > label { color: #6b6b76; display: flex; flex-direction: column; font-size: 12px; gap: 5px; }
    .modal__body input[type='text'], .modal__body input[type='email'], .modal__body input[type='password'] { border: 1px solid #dedee5; border-radius: 6px; font: inherit; font-size: 13px; padding: 8px 10px; }
    .modal__body input:disabled { background: #f6f6f9; color: #8a8a96; }
    .checkbox { align-items: flex-start; color: #2b2b33; display: flex; flex-direction: row; font-size: 13px; gap: 8px; }
    .checkbox input { margin-top: 2px; }
    .checkbox small { color: #8a8a96; display: block; font-size: 11px; }
    .roles { border: 1px solid #ececf1; border-radius: 8px; display: flex; flex-direction: column; gap: 10px; padding: 12px 14px; }
    .roles legend { color: #6b6b76; font-size: 11px; font-weight: 600; padding: 0 6px; text-transform: uppercase; }
    .modal__footer { align-items: center; border-top: 1px solid #ececf1; display: flex; gap: 8px; padding: 12px 18px; }
    .spacer { flex: 1; }
    .btn { background: #f2f2f6; border: 1px solid #dedee5; border-radius: 6px; cursor: pointer; font: inherit; font-size: 12px; padding: 8px 14px; }
    .btn--primary { background: #464feb; border-color: #464feb; color: #fff; }
    .icon-btn { background: none; border: 0; color: #6b6b76; cursor: pointer; display: inline-flex; }
  `],
})
export class UserList implements OnInit {
  private service = inject(AdministrationService);
  private toast = inject(ToastService);

  columns: TableColumn[] = [
    { key: 'username', label: 'Username', type: 'link' },
    { key: 'displayName', label: 'Display Name' },
    { key: 'email', label: 'Email' },
    { key: 'rolesLabel', label: 'Roles' },
    { key: 'statusLabel', label: 'Status', type: 'badge' },
    { key: 'lastLoginAtUtc', label: 'Last Login', type: 'date' },
    { key: 'actions', label: '', type: 'actions' },
  ];

  roles: AppRole[] = [];
  allRows: UserRow[] = [];
  filteredRows: UserRow[] = [];
  loading = true;
  error = '';
  showForm = false;
  showResetPassword = false;
  editing: AppUser | null = null;
  newPassword = '';
  canCreate = true;

  form = this.emptyForm();

  ngOnInit() {
    this.service.getRoles().subscribe({
      next: (roles) => (this.roles = roles),
      error: () => this.toast.error('Failed to load roles.'),
    });
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.service.getUsers().subscribe({
      next: (users) => {
        this.allRows = users.map((u) => ({
          ...u,
          rolesLabel: u.roleNames.join(', ') || '—',
          statusLabel: u.isActive ? 'Active' : 'Disabled',
        }));
        this.filteredRows = this.allRows;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load users. You may not have permission to manage users.';
        this.loading = false;
      },
    });
  }

  onSearch(term: string) {
    const t = term.toLowerCase();
    this.filteredRows = this.allRows.filter((r) =>
      `${r.username} ${r.displayName} ${r.email ?? ''} ${r.rolesLabel}`.toLowerCase().includes(t)
    );
  }

  openCreate() {
    this.editing = null;
    this.form = this.emptyForm();
    this.showForm = true;
  }

  openEdit(row: UserRow) {
    this.editing = row;
    this.form = {
      username: row.username,
      displayName: row.displayName,
      email: row.email ?? '',
      password: '',
      isActive: row.isActive,
      roleIds: [...row.roleIds],
    };
    this.showForm = true;
  }

  toggleRole(roleId: number) {
    this.form.roleIds = this.form.roleIds.includes(roleId)
      ? this.form.roleIds.filter((id) => id !== roleId)
      : [...this.form.roleIds, roleId];
  }

  save() {
    if (!this.form.displayName.trim()) {
      this.toast.error('Display name is required.');
      return;
    }
    if (!this.editing && !this.form.username.trim()) {
      this.toast.error('Username is required.');
      return;
    }
    if (!this.editing && this.form.password.length < 8) {
      this.toast.error('Password must be at least 8 characters.');
      return;
    }

    const request: Observable<unknown> = this.editing
      ? this.service.updateUser(this.editing.id, {
          displayName: this.form.displayName,
          email: this.form.email || null,
          isActive: this.form.isActive,
          roleIds: this.form.roleIds,
        })
      : this.service.createUser({
          username: this.form.username,
          displayName: this.form.displayName,
          email: this.form.email || null,
          password: this.form.password,
          isActive: this.form.isActive,
          roleIds: this.form.roleIds,
        });

    request.subscribe({
      next: () => {
        this.showForm = false;
        this.toast.success('User saved.');
        this.loadData();
      },
      error: (err) => this.toast.error(err?.error?.message ?? 'Failed to save the user.'),
    });
  }

  openResetPassword() {
    this.newPassword = '';
    this.showResetPassword = true;
  }

  resetPassword() {
    if (!this.editing) return;
    if (this.newPassword.length < 8) {
      this.toast.error('Password must be at least 8 characters.');
      return;
    }
    this.service.resetPassword(this.editing.id, this.newPassword).subscribe({
      next: () => {
        this.showResetPassword = false;
        this.toast.success('Password updated.');
      },
      error: () => this.toast.error('Failed to reset the password.'),
    });
  }

  onDelete(row: UserRow) {
    if (!confirm(`Delete the user "${row.username}"? This cannot be undone.`)) return;
    this.service.deleteUser(row.id).subscribe({
      next: () => {
        this.toast.success('User deleted.');
        this.loadData();
      },
      error: () => this.toast.error('Failed to delete the user.'),
    });
  }

  private emptyForm() {
    return { username: '', displayName: '', email: '', password: '', isActive: true, roleIds: [] as number[] };
  }
}
