import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { HasPermissionDirective } from '../../../../core/auth/has-permission.directive';
import { PermissionModule, PermissionPage, PermissionService } from '../../../../core/auth/permission.service';
import { AdministrationService, AppRole } from '../../services/administration.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeader, HasPermissionDirective],
  template: `
    <app-page-header
      title="Roles & Permissions"
      subtitle="Grant access by module, page and function"
      [searchable]="false"
      createLabel="New Role"
      (create)="startCreate()"
    />

    @if (loading) {
      <p>Loading roles…</p>
    } @else if (error) {
      <p class="error">{{ error }}</p>
    } @else {
      <div class="layout">
        <aside class="role-list">
          @for (role of roles; track role.id) {
            <button type="button" class="role-item" [class.role-item--active]="selectedRole?.id === role.id" (click)="select(role)">
              <span class="role-item__name">
                {{ role.name }}
                @if (role.isSystem) { <span class="tag">system</span> }
              </span>
              <span class="role-item__meta">{{ role.userCount }} user(s) · {{ role.permissions.length }} permission(s)</span>
            </button>
          }
          @if (creating) {
            <div class="role-item role-item--active"><span class="role-item__name">New role…</span></div>
          }
        </aside>

        <section class="editor">
          @if (!selectedRole && !creating) {
            <p class="hint">Select a role on the left, or create a new one.</p>
          } @else {
            <div class="editor__head">
              <label>
                Role Name
                <input type="text" [(ngModel)]="name" [disabled]="selectedRole?.isSystem === true" />
              </label>
              <label>
                Description
                <input type="text" [(ngModel)]="description" placeholder="What can this role do?" />
              </label>
              <div class="editor__actions">
                <button type="button" class="btn" (click)="selectAll(true)">Select all</button>
                <button type="button" class="btn" (click)="selectAll(false)">Clear all</button>
                <button type="button" class="btn btn--primary" (click)="save()">Save Role</button>
                @if (selectedRole && !selectedRole.isSystem) {
                  <button type="button" class="btn btn--danger" *hasPermission="'administration.roles.delete'" (click)="remove()">
                    Delete
                  </button>
                }
              </div>
            </div>

            @if (selectedRole?.isSystem) {
              <p class="hint">This is a system role — it always holds every permission and cannot be renamed or deleted.</p>
            }

            <div class="matrix">
              @for (module of catalog; track module.code) {
                <div class="module">
                  <label class="module__head">
                    <input
                      type="checkbox"
                      [checked]="isModuleFullySelected(module)"
                      [indeterminate]="isModulePartiallySelected(module)"
                      (change)="toggleModule(module)"
                    />
                    <span class="material-symbols-outlined">{{ module.icon }}</span>
                    <span class="module__name">{{ module.name }}</span>
                    <span class="module__count">{{ countSelected(module) }} / {{ countTotal(module) }}</span>
                  </label>

                  <div class="pages">
                    @for (page of module.pages; track page.code) {
                      <div class="page">
                        <label class="page__head">
                          <input
                            type="checkbox"
                            [checked]="isPageFullySelected(page)"
                            [indeterminate]="isPagePartiallySelected(page)"
                            (change)="togglePage(module, page)"
                          />
                          <span>{{ page.name }}</span>
                        </label>
                        <div class="actions">
                          @for (action of page.actions; track action.code) {
                            <label class="chip" [class.chip--on]="selected.has(action.code)">
                              <input type="checkbox" [checked]="selected.has(action.code)" (change)="toggleAction(module, page, action.code)" />
                              <span>{{ action.name }}</span>
                            </label>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </section>
      </div>
    }
  `,
  styles: [`
    .error { color: #c0392b; }
    .hint { color: #6b6b76; font-size: 12px; }
    .layout { align-items: start; display: grid; gap: 16px; grid-template-columns: 260px 1fr; }
    .role-list { background: #fff; border: 1px solid #e2e2e8; border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; }
    .role-item { background: none; border: 0; border-bottom: 1px solid #f0f0f4; cursor: pointer; display: flex; flex-direction: column; font: inherit; gap: 3px; padding: 11px 14px; text-align: left; }
    .role-item:hover { background: #fafafc; }
    .role-item--active { background: #eef0ff; box-shadow: inset 3px 0 0 #464feb; }
    .role-item__name { color: #2b2b33; font-size: 13px; font-weight: 600; }
    .role-item__meta { color: #8a8a96; font-size: 11px; }
    .tag { background: #e6e6ef; border-radius: 4px; color: #6b6b76; font-size: 9px; letter-spacing: 0.4px; margin-left: 6px; padding: 1px 5px; text-transform: uppercase; }
    .editor { background: #fff; border: 1px solid #e2e2e8; border-radius: 8px; padding: 16px 18px; }
    .editor__head { align-items: flex-end; display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; }
    .editor__head label { color: #6b6b76; display: flex; flex-direction: column; font-size: 12px; gap: 4px; }
    .editor__head input { border: 1px solid #dedee5; border-radius: 6px; font: inherit; font-size: 13px; padding: 7px 10px; width: 220px; }
    .editor__head input:disabled { background: #f6f6f9; color: #8a8a96; }
    .editor__actions { display: flex; gap: 8px; margin-left: auto; }
    .btn { background: #f2f2f6; border: 1px solid #dedee5; border-radius: 6px; cursor: pointer; font: inherit; font-size: 12px; padding: 8px 12px; }
    .btn--primary { background: #464feb; border-color: #464feb; color: #fff; }
    .btn--danger { background: #fff; border-color: #f0c8c4; color: #c0392b; }
    .matrix { display: flex; flex-direction: column; gap: 10px; }
    .module { border: 1px solid #ececf1; border-radius: 8px; overflow: hidden; }
    .module__head { align-items: center; background: #fafafc; cursor: pointer; display: flex; gap: 9px; padding: 10px 12px; }
    .module__head .material-symbols-outlined { color: #6b6b76; font-size: 19px; }
    .module__name { font-size: 13px; font-weight: 600; }
    .module__count { color: #8a8a96; font-size: 11px; margin-left: auto; }
    .pages { display: flex; flex-direction: column; }
    .page { border-top: 1px solid #f2f2f6; display: grid; gap: 8px; grid-template-columns: 210px 1fr; padding: 9px 12px; }
    .page__head { align-items: center; cursor: pointer; display: flex; font-size: 13px; gap: 8px; }
    .actions { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip { align-items: center; border: 1px solid #dedee5; border-radius: 20px; color: #6b6b76; cursor: pointer; display: inline-flex; font-size: 11px; gap: 5px; padding: 3px 10px 3px 7px; }
    .chip--on { background: #eef0ff; border-color: #c3c8ff; color: #3b41c4; }
    @media (max-width: 900px) {
      .layout { grid-template-columns: 1fr; }
      .page { grid-template-columns: 1fr; }
    }
  `],
})
export class RoleList implements OnInit {
  private service = inject(AdministrationService);
  private permissionService = inject(PermissionService);
  private toast = inject(ToastService);

  catalog: PermissionModule[] = [];
  roles: AppRole[] = [];
  selectedRole: AppRole | null = null;
  creating = false;
  selected = new Set<string>();
  name = '';
  description = '';
  loading = true;
  error = '';

  ngOnInit() {
    this.permissionService.getCatalog().subscribe({
      next: (catalog) => (this.catalog = catalog),
      error: () => this.toast.error('Failed to load the permission catalog.'),
    });
    this.loadRoles();
  }

  loadRoles() {
    this.loading = true;
    this.service.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.loading = false;
        const current = this.selectedRole && roles.find((r) => r.id === this.selectedRole!.id);
        if (current) this.select(current);
      },
      error: () => {
        this.error = 'Failed to load roles. You may not have permission to manage roles.';
        this.loading = false;
      },
    });
  }

  select(role: AppRole) {
    this.creating = false;
    this.selectedRole = role;
    this.name = role.name;
    this.description = role.description ?? '';
    this.selected = new Set(role.permissions);
  }

  startCreate() {
    this.creating = true;
    this.selectedRole = null;
    this.name = '';
    this.description = '';
    this.selected = new Set();
  }

  // --- selection helpers -------------------------------------------------

  private allCodes(module: PermissionModule): string[] {
    return module.pages.flatMap((p) => [p.code, ...p.actions.map((a) => a.code)]);
  }

  countTotal(module: PermissionModule) {
    return this.allCodes(module).length;
  }

  countSelected(module: PermissionModule) {
    return this.allCodes(module).filter((c) => this.selected.has(c)).length;
  }

  isModuleFullySelected(module: PermissionModule) {
    return this.countSelected(module) === this.countTotal(module);
  }

  isModulePartiallySelected(module: PermissionModule) {
    const count = this.countSelected(module);
    return count > 0 && count < this.countTotal(module);
  }

  isPageFullySelected(page: PermissionPage) {
    return this.selected.has(page.code) && page.actions.every((a) => this.selected.has(a.code));
  }

  isPagePartiallySelected(page: PermissionPage) {
    const codes = [page.code, ...page.actions.map((a) => a.code)];
    const count = codes.filter((c) => this.selected.has(c)).length;
    return count > 0 && count < codes.length;
  }

  toggleModule(module: PermissionModule) {
    const turnOn = !this.isModuleFullySelected(module);
    const codes = [module.code, ...this.allCodes(module)];
    codes.forEach((c) => (turnOn ? this.selected.add(c) : this.selected.delete(c)));
  }

  togglePage(module: PermissionModule, page: PermissionPage) {
    const turnOn = !this.isPageFullySelected(page);
    const codes = [page.code, ...page.actions.map((a) => a.code)];
    codes.forEach((c) => (turnOn ? this.selected.add(c) : this.selected.delete(c)));
    this.syncParents(module, page);
  }

  toggleAction(module: PermissionModule, page: PermissionPage, code: string) {
    if (this.selected.has(code)) this.selected.delete(code);
    else this.selected.add(code);
    this.syncParents(module, page);
  }

  // A page or action grant is meaningless without access to its parents.
  private syncParents(module: PermissionModule, page: PermissionPage) {
    const pageHasAny = page.actions.some((a) => this.selected.has(a.code));
    if (pageHasAny) this.selected.add(page.code);

    const moduleHasAny = this.allCodes(module).some((c) => this.selected.has(c));
    if (moduleHasAny) this.selected.add(module.code);
    else this.selected.delete(module.code);
  }

  selectAll(on: boolean) {
    if (!on) {
      this.selected = new Set();
      return;
    }
    this.selected = new Set(this.catalog.flatMap((m) => [m.code, ...this.allCodes(m)]));
  }

  // --- persistence -------------------------------------------------------

  save() {
    if (!this.name.trim()) {
      this.toast.error('Role name is required.');
      return;
    }

    const payload = { name: this.name.trim(), description: this.description.trim() || null, permissions: [...this.selected] };

    if (this.selectedRole) {
      this.service.updateRole(this.selectedRole.id, payload).subscribe({
        next: () => {
          this.toast.success('Role updated.');
          this.loadRoles();
        },
        error: (err) => this.toast.error(err?.error?.message ?? 'Failed to update the role.'),
      });
    } else {
      this.service.createRole(payload).subscribe({
        next: (role) => {
          this.creating = false;
          this.toast.success('Role created.');
          this.selectedRole = role;
          this.loadRoles();
        },
        error: (err) => this.toast.error(err?.error?.message ?? 'Failed to create the role.'),
      });
    }
  }

  remove() {
    if (!this.selectedRole) return;
    if (!confirm(`Delete the role "${this.selectedRole.name}"?`)) return;

    this.service.deleteRole(this.selectedRole.id).subscribe({
      next: () => {
        this.toast.success('Role deleted.');
        this.selectedRole = null;
        this.loadRoles();
      },
      error: (err) => this.toast.error(err?.error?.message ?? 'Failed to delete the role.'),
    });
  }
}
