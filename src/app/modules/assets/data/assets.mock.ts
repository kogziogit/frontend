export interface Asset {
  id: number;
  assetTag: string;
  name: string;
  category: 'Laptop' | 'Desktop' | 'Monitor' | 'Printer' | 'Mobile' | 'Furniture' | 'Other';
  brand?: string;
  model?: string;
  serialNumber?: string;
  assignedTo?: string;
  department?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  usefulLifeYears?: number;
  salvageValue?: number;
  warrantyExpiry?: string;
  location?: string;
  status: 'Available' | 'Assigned' | 'Under Repair' | 'Retired' | 'Lost';
  notes?: string;
  annualDepreciation?: number;
  accumulatedDepreciation?: number;
  currentValue?: number;
}
