export interface Employee {
  id: number;
  empId: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  department: string;
  designation: string;
  dateOfJoining: string;
  lastWorkingDate?: string | null;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
  manager: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notes: string;
  bankAccount?: string;
  paymentMode?: string;
  status: 'Active' | 'Pending' | 'On Leave' | 'Resigned' | 'Terminated' | 'Retired';
}

export const EMPLOYEES: Employee[] = [
  { id: 1, empId: 'EMP001', name: 'Aisha Khan', email: 'aisha.khan@example.com', phone: '+1 555 0201', department: 'Engineering', designation: 'Senior Developer', dateOfJoining: '2024-01-15', employmentType: 'Full-time', manager: 'Maria Fernandez', address: '12 Tech Park', emergencyContactName: 'Imran Khan', emergencyContactPhone: '+1 555 0301', notes: '', status: 'Active' },
  { id: 2, empId: 'EMP002', name: 'Rahul Nair', email: 'rahul.nair@example.com', phone: '+1 555 0202', department: 'Sales', designation: 'Sales Executive', dateOfJoining: '2026-06-10', employmentType: 'Full-time', manager: 'Aisha Khan', address: '24 Lake Road', emergencyContactName: 'Meera Nair', emergencyContactPhone: '+1 555 0302', notes: '', status: 'Active' },
  { id: 3, empId: 'EMP003', name: 'Maria Fernandez', email: 'maria.fernandez@example.com', phone: '+1 555 0203', department: 'HR', designation: 'HR Manager', dateOfJoining: '2023-03-01', employmentType: 'Full-time', manager: '', address: '8 Central Avenue', emergencyContactName: 'Luis Fernandez', emergencyContactPhone: '+1 555 0303', notes: '', status: 'Active' },
  { id: 4, empId: 'EMP004', name: 'John Mathew', email: 'john.mathew@example.com', phone: '+1 555 0204', department: 'Finance', designation: 'Accountant', dateOfJoining: '2026-02-01', employmentType: 'Contract', manager: 'Maria Fernandez', address: '41 Hill Street', emergencyContactName: 'Anita Mathew', emergencyContactPhone: '+1 555 0304', notes: '', status: 'Pending' },
  { id: 5, empId: 'EMP005', name: 'Fatima Al-Sayed', email: 'fatima.alsayed@example.com', phone: '+1 555 0205', department: 'Engineering', designation: 'QA Engineer', dateOfJoining: '2025-09-15', employmentType: 'Full-time', manager: 'Maria Fernandez', address: '7 Garden Lane', emergencyContactName: 'Omar Al-Sayed', emergencyContactPhone: '+1 555 0305', notes: '', status: 'Terminated' },
];
