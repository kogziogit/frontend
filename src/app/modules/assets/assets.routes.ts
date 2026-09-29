import { Routes } from '@angular/router';
import { ModuleLayout } from '../../shared/ui/module-layout/module-layout';
import { permissionGuard } from '../../core/auth/permission.guard';

export const ASSETS_ROUTES: Routes = [
  {
    path: '',
    component: ModuleLayout,
    data: {
      tabs: [
        { label: 'Dashboard', path: '', permission: 'assets.dashboard.view' },
        { label: 'Assets', path: 'assets', permission: 'assets.assets.view' },
      ],
    },
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/asset-dashboard/asset-dashboard').then((m) => m.AssetDashboard),
        canActivate: [permissionGuard],
        data: { permission: 'assets.dashboard.view' },
        title: 'Asset Dashboard',
      },
      {
        path: 'assets',
        loadComponent: () => import('./pages/asset-list/asset-list').then((m) => m.AssetList),
        canActivate: [permissionGuard],
        data: { permission: 'assets.assets.view' },
        title: 'Assets',
      },
    ],
  },
];
