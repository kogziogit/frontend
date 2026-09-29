import { Routes } from '@angular/router';
import { ModuleLayout } from '../../shared/ui/module-layout/module-layout';
import { permissionGuard } from '../../core/auth/permission.guard';

export const ACCOUNTING_ROUTES: Routes = [
  {
    path: '',
    component: ModuleLayout,
    data: {
      tabs: [
        { label: 'Dashboard', path: '', permission: 'accounting.dashboard.view' },
        { label: 'Invoices', path: 'invoices', permission: 'accounting.invoices.view' },
        { label: 'Vendor Bills', path: 'bills', permission: 'accounting.bills.view' },
        { label: 'Clients', path: 'clients', permission: 'accounting.customers.view' },
        { label: 'Payments', path: 'payments', permission: 'accounting.payments.view' },
        { label: 'Chart of Accounts', path: 'chart-of-accounts', permission: 'accounting.chartofaccounts.view' },
        { label: 'Journal Entries', path: 'journal-entries', permission: 'accounting.journalentries.view' },
        { label: 'Reports', path: 'reports', permission: 'accounting.reports.view' },
        { label: 'General Ledger', path: 'general-ledger', permission: 'accounting.generalledger.view' },
        { label: 'Audit Log', path: 'audit-log', permission: 'accounting.auditlog.view' },
      ],
    },
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/accounting-dashboard/accounting-dashboard').then((m) => m.AccountingDashboard),
        canActivate: [permissionGuard],
        data: { permission: 'accounting.dashboard.view' },
        title: 'Accounting Dashboard',
      },
      {
        path: 'invoices',
        loadComponent: () => import('./pages/move-list/move-list').then((m) => m.MoveList),
        canActivate: [permissionGuard],
        data: { permission: 'accounting.invoices.view', moveType: 'out_invoice' },
        title: 'Customer Invoices',
      },
      {
        path: 'bills',
        loadComponent: () => import('./pages/move-list/move-list').then((m) => m.MoveList),
        canActivate: [permissionGuard],
        data: { permission: 'accounting.bills.view', moveType: 'in_invoice' },
        title: 'Vendor Bills',
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/financial-reports/financial-reports').then((m) => m.FinancialReports),
        canActivate: [permissionGuard],
        data: { permission: 'accounting.reports.view' },
        title: 'Financial Reports',
      },
      {
        path: 'clients',
        loadComponent: () => import('./pages/customer-list/customer-list').then((m) => m.CustomerList),
        canActivate: [permissionGuard],
        data: { permission: 'accounting.customers.view' },
        title: 'Clients',
      },
      {
        path: 'payments',
        loadComponent: () => import('./pages/payment-list/payment-list').then((m) => m.PaymentList),
        canActivate: [permissionGuard],
        data: { permission: 'accounting.payments.view' },
        title: 'Payments',
      },
      {
        path: 'audit-log',
        loadComponent: () => import('./pages/audit-log-list/audit-log-list').then((m) => m.AuditLogList),
        canActivate: [permissionGuard],
        data: { permission: 'accounting.auditlog.view' },
        title: 'Audit Log',
      },
      {
        path: 'chart-of-accounts',
        loadComponent: () => import('./pages/chart-of-accounts/chart-of-accounts').then((m) => m.ChartOfAccounts),
        canActivate: [permissionGuard],
        data: { permission: 'accounting.chartofaccounts.view' },
        title: 'Chart of Accounts',
      },
      {
        path: 'journal-entries',
        loadComponent: () => import('./pages/journal-entries/journal-entries').then((m) => m.JournalEntries),
        canActivate: [permissionGuard],
        data: { permission: 'accounting.journalentries.view' },
        title: 'Journal Entries',
      },
      {
        path: 'general-ledger',
        loadComponent: () => import('./pages/general-ledger/general-ledger').then((m) => m.GeneralLedger),
        canActivate: [permissionGuard],
        data: { permission: 'accounting.generalledger.view' },
        title: 'General Ledger',
      },
    ],
  },
];
