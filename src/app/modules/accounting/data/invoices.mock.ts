export interface InvoiceItem {
  id?: number;
  serviceDescription: string;
  hsnSac: string;
  qty: number;
  rate: number;
  amount: number;
  sortOrder?: number;
}

export interface Invoice {
  id: number;
  invoiceNo: string;
  customer: string;
  dueDate: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  currency?: string;
  amountCredited?: number;
  pendingBalance?: number;
  serviceDescription?: string;
  hsnSac?: string;
  items?: InvoiceItem[];
  notes?: string;
}

export const INVOICES: Invoice[] = [
  { id: 1, invoiceNo: 'INV0001', customer: 'Azure Interior', dueDate: '2026-09-20', amount: 4250.0, status: 'Paid' },
  { id: 2, invoiceNo: 'INV0002', customer: 'Deco Addict', dueDate: '2026-09-25', amount: 1899.5, status: 'Pending' },
  { id: 3, invoiceNo: 'INV0003', customer: 'Gemini Furniture', dueDate: '2026-09-10', amount: 7420.0, status: 'Overdue' },
  { id: 4, invoiceNo: 'INV0004', customer: 'Ready Mat', dueDate: '2026-10-02', amount: 980.0, status: 'Pending' },
];
