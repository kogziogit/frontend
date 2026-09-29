import { Routes } from '@angular/router';
import { Shell } from './core/layout/shell/shell';
import { AppLauncher } from './core/layout/app-launcher/app-launcher';
import { authGuard } from './core/auth/auth.guard';
import { permissionGuard } from './core/auth/permission.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./core/auth/login/login').then((m) => m.Login),
    title: 'Sign in - Kogzio ERP',
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', component: AppLauncher, title: 'Kogzio ERP' },
      {
        path: 'forbidden',
        loadComponent: () => import('./core/auth/forbidden/forbidden').then((m) => m.Forbidden),
        title: 'Access denied',
      },
      {
        path: 'sales',
        canActivate: [permissionGuard],
        data: { permission: 'sales' },
        loadChildren: () => import('./modules/sales/sales.routes').then((m) => m.SALES_ROUTES),
      },
      {
        path: 'purchase',
        canActivate: [permissionGuard],
        data: { permission: 'purchase' },
        loadChildren: () => import('./modules/purchase/purchase.routes').then((m) => m.PURCHASE_ROUTES),
      },
      {
        path: 'hr',
        canActivate: [permissionGuard],
        data: { permission: 'hr' },
        loadChildren: () => import('./modules/hr/hr.routes').then((m) => m.HR_ROUTES),
      },
      {
        path: 'accounting',
        canActivate: [permissionGuard],
        data: { permission: 'accounting' },
        loadChildren: () => import('./modules/accounting/accounting.routes').then((m) => m.ACCOUNTING_ROUTES),
      },
      {
        path: 'crm',
        canActivate: [permissionGuard],
        data: { permission: 'crm' },
        loadChildren: () => import('./modules/crm/crm.routes').then((m) => m.CRM_ROUTES),
      },
      {
        path: 'assets',
        canActivate: [permissionGuard],
        data: { permission: 'assets' },
        loadChildren: () => import('./modules/assets/assets.routes').then((m) => m.ASSETS_ROUTES),
      },
      {
        path: 'timesheet',
        canActivate: [permissionGuard],
        data: { permission: 'timesheet' },
        loadChildren: () => import('./modules/timesheet/timesheet.routes').then((m) => m.TIMESHEET_ROUTES),
      },
      {
        path: 'administration',
        canActivate: [permissionGuard],
        data: { permission: 'administration' },
        loadChildren: () => import('./modules/administration/administration.routes').then((m) => m.ADMINISTRATION_ROUTES),
      },
    ],
  },
];
