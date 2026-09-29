import { Routes } from '@angular/router';
import { ModuleLayout } from '../../shared/ui/module-layout/module-layout';
import { permissionGuard } from '../../core/auth/permission.guard';

export const SALES_ROUTES: Routes = [
  {
    path: '',
    component: ModuleLayout,
    data: {
      tabs: [
        { label: 'Dashboard', path: '', permission: 'sales.dashboard.view' },
        { label: 'Orders', path: 'orders', permission: 'sales.orders.view' },
        { label: 'Customers', path: 'customers', permission: 'sales.customers.view' },
      ],
    },
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/sales-dashboard/sales-dashboard').then((m) => m.SalesDashboard),
        canActivate: [permissionGuard],
        data: { permission: 'sales.dashboard.view' },
        title: 'Sales Dashboard',
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/order-list/order-list').then((m) => m.OrderList),
        canActivate: [permissionGuard],
        data: { permission: 'sales.orders.view' },
        title: 'Orders',
      },
      {
        path: 'customers',
        loadComponent: () => import('../../shared/ui/coming-soon/coming-soon').then((m) => m.ComingSoon),
        canActivate: [permissionGuard],
        data: { title: 'Customers', moduleName: 'Sales', permission: 'sales.customers.view' },
        title: 'Customers',
      },
    ],
  },
];
