import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Employee } from '../data/employees.mock';

export interface LeaveRequest {
  id: number;
  employeeId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Refused' | 'Cancelled';
  requestedDate: string;
  approvedDate?: string | null;
}

export interface LeaveBalance {
  employeeId: number;
  year: number;
  joiningDate: string;
  leaveType: string;
  annualEntitlement: number;
  accruedDays: number;
  approvedDays: number;
  pendingDays: number;
  remainingDays: number;
}

export interface EmployeeSalary {
  id: number;
  employeeId: number;
  basic: number;
  hra: number;
  conveyance: number;
  medicalAllowance: number;
  specialAllowance: number;
  otherAllowance: number;
  pfPercentage: number;
  professionalTax: number;
  tds: number;
  grossMonthly: number;
}

export interface Payslip {
  id: number;
  employeeId: number;
  month: number;
  year: number;
  currency: string;
  basic: number;
  hra: number;
  conveyance: number;
  medicalAllowance: number;
  specialAllowance: number;
  otherAllowance: number;
  grossSalary: number;
  workingDays: number;
  lopDays: number;
  paidDays: number;
  lopDeduction: number;
  providentFund: number;
  professionalTax: number;
  tds: number;
  totalDeductions: number;
  netPay: number;
  status: 'Generated' | 'Paid';
  generatedDate: string;
}

@Injectable({ providedIn: 'root' })
export class HrService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/hr/employees`;

  getAll() {
    return this.http.get<Employee[]>(this.baseUrl);
  }

  create(employee: Partial<Employee>) {
    return this.http.post<Employee>(this.baseUrl, employee);
  }

  update(id: number, employee: Employee) {
    return this.http.put<void>(`${this.baseUrl}/${id}`, employee);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getLeaveRequests() {
    return this.http.get<LeaveRequest[]>(`${environment.apiBaseUrl}/hr/leaverequests`);
  }

  createLeaveRequest(request: Partial<LeaveRequest>) {
    return this.http.post<LeaveRequest>(`${environment.apiBaseUrl}/hr/leaverequests`, request);
  }

  updateLeaveRequest(id: number, request: LeaveRequest) {
    return this.http.put<void>(`${environment.apiBaseUrl}/hr/leaverequests/${id}`, request);
  }

  deleteLeaveRequest(id: number) {
    return this.http.delete<void>(`${environment.apiBaseUrl}/hr/leaverequests/${id}`);
  }

  getLeaveBalances(employeeId: number, year = new Date().getFullYear()) {
    return this.http.get<LeaveBalance[]>(`${environment.apiBaseUrl}/hr/leaverequests/balances/${employeeId}?year=${year}`);
  }

  addLeaveBalanceAdjustment(adjustment: { employeeId: number; year: number; leaveType: string; days: number; reason: string }) {
    return this.http.post<void>(`${environment.apiBaseUrl}/hr/leaverequests/balances/adjustments`, adjustment);
  }

  getSalary(employeeId: number) {
    return this.http.get<EmployeeSalary>(`${environment.apiBaseUrl}/hr/employeesalaries/${employeeId}`);
  }

  saveSalary(salary: Partial<EmployeeSalary>) {
    return this.http.post<EmployeeSalary>(`${environment.apiBaseUrl}/hr/employeesalaries`, salary);
  }

  getPayslips() {
    return this.http.get<Payslip[]>(`${environment.apiBaseUrl}/hr/payslips`);
  }

  generatePayslip(request: { employeeId: number; month: number; year: number; currency: string }) {
    return this.http.post<Payslip>(`${environment.apiBaseUrl}/hr/payslips/generate`, request);
  }

  markPayslipPaid(id: number) {
    return this.http.post<void>(`${environment.apiBaseUrl}/hr/payslips/${id}/mark-paid`, {});
  }

  deletePayslip(id: number) {
    return this.http.delete<void>(`${environment.apiBaseUrl}/hr/payslips/${id}`);
  }
}
