import { Routes } from '@angular/router';
import { ModuleLayout } from '../../shared/ui/module-layout/module-layout';
import { permissionGuard } from '../../core/auth/permission.guard';

export const PURCHASE_ROUTES: Routes = [
  {
    path: '',
    component: ModuleLayout,
    data: {
      tabs: [
        { label: 'Dashboard', path: '', permission: 'purchase.dashboard.view' },
        { label: 'Purchase Orders', path: 'orders', permission: 'purchase.orders.view' },
        { label: 'Vendors', path: 'vendors', permission: 'purchase.vendors.view' },
      ],
    },
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/purchase-dashboard/purchase-dashboard').then((m) => m.PurchaseDashboard),
        canActivate: [permissionGuard],
        data: { permission: 'purchase.dashboard.view' },
        title: 'Purchase Dashboard',
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/purchase-order-list/purchase-order-list').then((m) => m.PurchaseOrderList),
        canActivate: [permissionGuard],
        data: { permission: 'purchase.orders.view' },
        title: 'Purchase Orders',
      },
      {
        path: 'vendors',
        loadComponent: () => import('../../shared/ui/coming-soon/coming-soon').then((m) => m.ComingSoon),
        canActivate: [permissionGuard],
        data: { title: 'Vendors', moduleName: 'Purchase', permission: 'purchase.vendors.view' },
        title: 'Vendors',
      },
    ],
  },
];
