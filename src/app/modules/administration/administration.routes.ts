import { Routes } from '@angular/router';
import { ModuleLayout } from '../../shared/ui/module-layout/module-layout';
import { permissionGuard } from '../../core/auth/permission.guard';

export const ADMINISTRATION_ROUTES: Routes = [
  {
    path: '',
    component: ModuleLayout,
    data: {
      tabs: [
        { label: 'Users', path: 'users' },
        { label: 'Roles & Permissions', path: 'roles' },
      ],
    },
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      {
        path: 'users',
        loadComponent: () => import('./pages/user-list/user-list').then((m) => m.UserList),
        canActivate: [permissionGuard],
        data: { permission: 'administration.users.view' },
        title: 'Users',
      },
      {
        path: 'roles',
        loadComponent: () => import('./pages/role-list/role-list').then((m) => m.RoleList),
        canActivate: [permissionGuard],
        data: { permission: 'administration.roles.view' },
        title: 'Roles & Permissions',
      },
    ],
  },
];
