import { Routes } from '@angular/router';
import { ModuleLayout } from '../../shared/ui/module-layout/module-layout';
import { permissionGuard } from '../../core/auth/permission.guard';

export const HR_ROUTES: Routes = [
  {
    path: '',
    component: ModuleLayout,
    data: {
      tabs: [
        { label: 'Dashboard', path: '', permission: 'hr.dashboard.view' },
        { label: 'Employees', path: 'employees', permission: 'hr.employees.view' },
        { label: 'Attendance', path: 'attendance', permission: 'hr.attendance.view' },
        { label: 'Leaves', path: 'leaves', permission: 'hr.leaves.view' },
        { label: 'Payslips', path: 'payslips', permission: 'hr.payslips.view' },
        { label: 'Org Structure', path: 'org-structure', permission: 'hr.orgstructure.view' },
        { label: 'Holidays', path: 'holidays', permission: 'hr.holidays.view' },
        { label: 'Performance', path: 'performance', permission: 'hr.performance.view' },
        { label: 'Recruitment', path: 'recruitment', permission: 'hr.recruitment.view' },
      ],
    },
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/hr-dashboard/hr-dashboard').then((m) => m.HrDashboard),
        canActivate: [permissionGuard],
        data: { permission: 'hr.dashboard.view' },
        title: 'HR Dashboard',
      },
      {
        path: 'employees',
        loadComponent: () => import('./pages/employee-list/employee-list').then((m) => m.EmployeeList),
        canActivate: [permissionGuard],
        data: { permission: 'hr.employees.view' },
        title: 'Employees',
      },
      {
        path: 'attendance',
        loadComponent: () => import('./pages/attendance-list/attendance-list').then((m) => m.AttendanceList),
        canActivate: [permissionGuard],
        data: { permission: 'hr.attendance.view' },
        title: 'Attendance',
      },
      {
        path: 'leaves',
        loadComponent: () => import('./pages/leave-list/leave-list').then((m) => m.LeaveList),
        canActivate: [permissionGuard],
        data: { permission: 'hr.leaves.view' },
        title: 'Leaves',
      },
      {
        path: 'payslips',
        loadComponent: () => import('./pages/payslip-list/payslip-list').then((m) => m.PayslipList),
        canActivate: [permissionGuard],
        data: { permission: 'hr.payslips.view' },
        title: 'Payslips',
      },
      {
        path: 'org-structure',
        loadComponent: () => import('./pages/org-structure/org-structure').then((m) => m.OrgStructure),
        canActivate: [permissionGuard],
        data: { permission: 'hr.orgstructure.view' },
        title: 'Org Structure',
      },
      {
        path: 'holidays',
        loadComponent: () => import('./pages/holiday-list/holiday-list').then((m) => m.HolidayList),
        canActivate: [permissionGuard],
        data: { permission: 'hr.holidays.view' },
        title: 'Holidays',
      },
      {
        path: 'performance',
        loadComponent: () => import('./pages/performance-review-list/performance-review-list').then((m) => m.PerformanceReviewList),
        canActivate: [permissionGuard],
        data: { permission: 'hr.performance.view' },
        title: 'Performance Reviews',
      },
      {
        path: 'recruitment',
        loadComponent: () => import('./pages/recruitment/recruitment').then((m) => m.Recruitment),
        canActivate: [permissionGuard],
        data: { permission: 'hr.recruitment.view' },
        title: 'Recruitment',
      },
    ],
  },
];
