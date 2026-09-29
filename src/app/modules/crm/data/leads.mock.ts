export interface Lead {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  jobTitle: string;
  website: string;
  address: string;
  city: string;
  country: string;
  source: string;
  expectedRevenue: number;
  status: 'New' | 'Qualified' | 'Won' | 'Lost';
  notes: string;
}

export const LEADS: Lead[] = [
  { id: 1, name: 'Priya Sharma', company: 'Nimbus Retail', email: 'priya.sharma@example.com', phone: '+1 555 0101', jobTitle: 'Procurement Manager', website: 'https://nimbus-retail.example.com', address: '12 Market Street', city: 'Mumbai', country: 'India', source: 'Website', expectedRevenue: 8500, status: 'Qualified', notes: '' },
  { id: 2, name: 'Tom Becker', company: 'Fortis Traders', email: 'tom.becker@example.com', phone: '+1 555 0102', jobTitle: 'Owner', website: '', address: '24 River Road', city: 'Berlin', country: 'Germany', source: 'Referral', expectedRevenue: 4200, status: 'New', notes: '' },
  { id: 3, name: 'Layla Haddad', company: 'Orion Foods', email: 'layla.haddad@example.com', phone: '+1 555 0103', jobTitle: 'Operations Director', website: '', address: '8 Orchard Avenue', city: 'Dubai', country: 'UAE', source: 'Campaign', expectedRevenue: 12500, status: 'Won', notes: '' },
  { id: 4, name: 'Chen Wei', company: 'Skyline Logistics', email: 'chen.wei@example.com', phone: '+1 555 0104', jobTitle: 'Commercial Lead', website: '', address: '41 Harbour Road', city: 'Singapore', country: 'Singapore', source: 'Cold Call', expectedRevenue: 3100, status: 'Lost', notes: '' },
  { id: 5, name: 'Grace Otieno', company: 'Baobab Textiles', email: 'grace.otieno@example.com', phone: '+1 555 0105', jobTitle: 'Sales Manager', website: '', address: '7 Garden Lane', city: 'Nairobi', country: 'Kenya', source: 'Website', expectedRevenue: 6700, status: 'Qualified', notes: '' },
];
