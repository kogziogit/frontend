export interface PurchaseOrder {
  id: number;
  poNo: string;
  vendor: string;
  orderDate: string;
  total: number;
  status: 'Draft' | 'To Approve' | 'Confirmed' | 'Cancelled';
}

export const PURCHASE_ORDERS: PurchaseOrder[] = [
  { id: 1, poNo: 'PO0001', vendor: 'Wood Corner', orderDate: '2026-09-01', total: 3200.0, status: 'Confirmed' },
  { id: 2, poNo: 'PO0002', vendor: 'Metal Works', orderDate: '2026-09-04', total: 1250.0, status: 'To Approve' },
  { id: 3, poNo: 'PO0003', vendor: 'Ready Mat', orderDate: '2026-09-09', total: 5400.0, status: 'Draft' },
  { id: 4, poNo: 'PO0004', vendor: 'Azure Interior', orderDate: '2026-09-15', total: 890.0, status: 'Cancelled' },
];
