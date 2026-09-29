import { Routes } from '@angular/router';
import { ModuleLayout } from '../../shared/ui/module-layout/module-layout';
import { permissionGuard } from '../../core/auth/permission.guard';

export const TIMESHEET_ROUTES: Routes = [
  {
    path: '',
    component: ModuleLayout,
    data: {
      tabs: [
        { label: 'Dashboard', path: '', permission: 'timesheet.dashboard.view' },
        { label: 'Daily Entry', path: 'weekly', permission: 'timesheet.weekly.view' },
        { label: 'Entries', path: 'entries', permission: 'timesheet.entries.view' },
      ],
    },
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/timesheet-dashboard/timesheet-dashboard').then((m) => m.TimesheetDashboard),
        canActivate: [permissionGuard],
        data: { permission: 'timesheet.dashboard.view' },
        title: 'Timesheet Dashboard',
      },
      {
        path: 'weekly',
        loadComponent: () => import('./pages/weekly-timesheet/weekly-timesheet').then((m) => m.WeeklyTimesheet),
        canActivate: [permissionGuard],
        data: { permission: 'timesheet.weekly.view' },
        title: 'Daily Timesheet Entry',
      },
      {
        path: 'entries',
        loadComponent: () => import('./pages/timesheet-list/timesheet-list').then((m) => m.TimesheetList),
        canActivate: [permissionGuard],
        data: { permission: 'timesheet.entries.view' },
        title: 'Timesheet Entries',
      },
    ],
  },
];
