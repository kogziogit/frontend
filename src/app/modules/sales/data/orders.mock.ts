export interface SalesOrder {
  id: number;
  orderNo: string;
  customer: string;
  orderDate: string;
  total: number;
  status: 'Draft' | 'Confirmed' | 'Done' | 'Cancelled';
}

export const SALES_ORDERS: SalesOrder[] = [
  { id: 1, orderNo: 'SO0001', customer: 'Azure Interior', orderDate: '2026-09-02', total: 4250.0, status: 'Confirmed' },
  { id: 2, orderNo: 'SO0002', customer: 'Deco Addict', orderDate: '2026-09-05', total: 1899.5, status: 'Draft' },
  { id: 3, orderNo: 'SO0003', customer: 'Gemini Furniture', orderDate: '2026-09-10', total: 7420.0, status: 'Done' },
  { id: 4, orderNo: 'SO0004', customer: 'Ready Mat', orderDate: '2026-09-12', total: 980.0, status: 'Cancelled' },
  { id: 5, orderNo: 'SO0005', customer: 'Lumber Inc', orderDate: '2026-09-18', total: 3120.75, status: 'Confirmed' },
];
