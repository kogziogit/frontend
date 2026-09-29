import { Routes } from '@angular/router';
import { ModuleLayout } from '../../shared/ui/module-layout/module-layout';
import { permissionGuard } from '../../core/auth/permission.guard';

export const CRM_ROUTES: Routes = [
  {
    path: '',
    component: ModuleLayout,
    data: {
      tabs: [
        { label: 'Dashboard', path: '', permission: 'crm.dashboard.view' },
        { label: 'Leads', path: 'leads', permission: 'crm.leads.view' },
        { label: 'Pipeline', path: 'pipeline', permission: 'crm.pipeline.view' },
        { label: 'Follow-ups', path: 'activities', permission: 'crm.activities.view' },
      ],
    },
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/crm-dashboard/crm-dashboard').then((m) => m.CrmDashboard),
        canActivate: [permissionGuard],
        data: { permission: 'crm.dashboard.view' },
        title: 'CRM Dashboard',
      },
      {
        path: 'leads',
        loadComponent: () => import('./pages/lead-list/lead-list').then((m) => m.LeadList),
        canActivate: [permissionGuard],
        data: { permission: 'crm.leads.view' },
        title: 'Leads',
      },
      {
        path: 'leads/:id',
        loadComponent: () => import('./pages/lead-detail/lead-detail').then((m) => m.LeadDetail),
        canActivate: [permissionGuard],
        data: { permission: 'crm.leads.view' },
        title: 'Lead Details',
      },
      {
        path: 'pipeline',
        loadComponent: () => import('./pages/pipeline/pipeline').then((m) => m.Pipeline),
        canActivate: [permissionGuard],
        data: { permission: 'crm.pipeline.view' },
        title: 'Pipeline',
      },
      {
        path: 'activities',
        loadComponent: () => import('./pages/activity-list/activity-list').then((m) => m.ActivityList),
        canActivate: [permissionGuard],
        data: { permission: 'crm.activities.view' },
        title: 'CRM Follow-ups',
      },
    ],
  },
];
