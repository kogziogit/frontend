export interface TimesheetEntry {
  id: number;
  employeeId: number;
  customer: string;
  project: string;
  taskDescription: string;
  workDate: string;
  hours: number;
  billable: boolean;
  ratePerHour: number;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Invoiced';
  invoiceNo?: string | null;
  amount?: number;
}
