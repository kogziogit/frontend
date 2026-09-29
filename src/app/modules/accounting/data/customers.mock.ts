export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  taxNumber?: string;
  pan?: string;
  gst?: string;
  invoicePrefix?: string;
  status: 'Active' | 'Inactive';
}
