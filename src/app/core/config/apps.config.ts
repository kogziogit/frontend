export interface AppModuleConfig {
  key: string;
  name: string;
  icon: string;
  color: string;
  route: string;
  description: string;
}

/** Registry of ERP micro-apps shown in the app launcher and navbar switcher. */
export const APP_MODULES: AppModuleConfig[] = [
  { key: 'sales', name: 'Sales', icon: 'point_of_sale', color: '#00a09d', route: '/sales', description: 'Quotations, orders & customers' },
  { key: 'purchase', name: 'Purchase', icon: 'shopping_cart', color: '#f0ad4e', route: '/purchase', description: 'Vendors & purchase orders' },
  { key: 'hr', name: 'HR', icon: 'badge', color: '#875a7b', route: '/hr', description: 'Employees, leaves & attendance' },
  { key: 'accounting', name: 'Accounting', icon: 'account_balance', color: '#2c5f9e', route: '/accounting', description: 'Invoices, payments & ledgers' },
  { key: 'crm', name: 'CRM', icon: 'groups', color: '#d9534f', route: '/crm', description: 'Leads & sales pipeline' },
  { key: 'assets', name: 'Assets', icon: 'devices', color: '#5c6bc0', route: '/assets', description: 'Laptops, printers & equipment' },
  { key: 'timesheet', name: 'Timesheet', icon: 'schedule', color: '#e07b39', route: '/timesheet', description: 'Log hours & bill customers' },
  { key: 'administration', name: 'Administration', icon: 'admin_panel_settings', color: '#5f6368', route: '/administration', description: 'Users, roles & permissions' },
];
