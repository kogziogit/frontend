import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataTable, TableColumn } from '../../../../shared/ui/data-table/data-table';
import { Employee } from '../../data/employees.mock';
import { HrService, EmployeeSalary, Payslip } from '../../services/hr.service';
import { PayslipPdfService } from '../../services/payslip-pdf.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { AuthService } from '../../../../core/auth/auth.service';

interface PayslipRow extends Payslip {
  employeeName: string;
  period: string;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

@Component({
  selector: 'app-payslip-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTable],
  template: `
    <section class="salary-panel">
      @if (canManagePayroll) {
      <div class="salary-heading">
        <div><h2>Salary structure & payslip generation</h2><p>Set a monthly salary structure, then generate a payslip. Loss of Pay (LOP) is calculated automatically from approved Unpaid Leave.</p></div>
        <select [(ngModel)]="selectedEmployeeId" (ngModelChange)="onEmployeeChange()">
          @for (employee of employees; track employee.id) { <option [ngValue]="employee.id">{{ employee.name }}</option> }
        </select>
      </div>

      @if (canManagePayroll && selectedEmployeeId) {
        <div class="salary-grid">
          <label>Basic<input type="number" [(ngModel)]="salary.basic" /></label>
          <label>HRA<input type="number" [(ngModel)]="salary.hra" /></label>
          <label>Conveyance<input type="number" [(ngModel)]="salary.conveyance" /></label>
          <label>Medical Allowance<input type="number" [(ngModel)]="salary.medicalAllowance" /></label>
          <label>Special Allowance<input type="number" [(ngModel)]="salary.specialAllowance" /></label>
          <label>Other Allowance<input type="number" [(ngModel)]="salary.otherAllowance" /></label>
          <label>PF %<input type="number" [(ngModel)]="salary.pfPercentage" /></label>
          <label>Professional Tax<input type="number" [(ngModel)]="salary.professionalTax" /></label>
          <label>TDS<input type="number" [(ngModel)]="salary.tds" /></label>
        </div>
        @if (editingPayslip) {
          <div class="edit-banner">
            Editing {{ editingPayslip.employeeName }} — {{ editingPayslip.period }}
            <button class="btn btn--secondary" type="button" (click)="cancelEdit()">Cancel Edit</button>
          </div>
        }
        <div class="salary-actions">
          <span class="gross">Gross Monthly: <strong>{{ grossMonthly.toFixed(2) }}</strong></span>
          <button class="btn btn--secondary" type="button" (click)="saveSalary()">Save Salary Structure</button>
        </div>

        <div class="generate-row">
          <select [(ngModel)]="genMonth">
            @for (name of monthNames; track name; let i = $index) { <option [ngValue]="i + 1">{{ name }}</option> }
          </select>
          <input type="number" [(ngModel)]="genYear" />
          <select [(ngModel)]="genCurrency">
            @for (currency of currencies; track currency.code) { <option [ngValue]="currency.code">{{ currency.code }} — {{ currency.name }}</option> }
          </select>
          <button class="btn btn--primary" type="button" (click)="generate()">{{ editingPayslip ? 'Update Payslip' : 'Generate Payslip' }}</button>
        </div>
      }
      }
    </section>

      @if (!canManagePayroll) {
        <div class="employee-payroll-filter">
          <strong>{{ currentEmployeeName }}</strong>
          <span>Select a month and year to view your generated payslip.</span>
        </div>
      }
      @if (canManagePayroll) {
        <div class="generate-row standalone-filter">
          <select [(ngModel)]="filterMonth" (ngModelChange)="loadPayslips()"><option value="all">All months</option>@for (name of monthNames; track name; let i = $index) { <option [ngValue]="i + 1">{{ name }}</option> }</select>
          <select [(ngModel)]="filterYear" (ngModelChange)="loadPayslips()"><option value="all">All years</option>@for (year of availableYears; track year) { <option [ngValue]="year">{{ year }}</option> }</select>
        </div>
      } @else {
        <div class="generate-row standalone-filter">
          <select [(ngModel)]="filterMonth" (ngModelChange)="loadPayslips()"><option value="all">All months</option>@for (name of monthNames; track name; let i = $index) { <option [ngValue]="i + 1">{{ name }}</option> }</select>
          <select [(ngModel)]="filterYear" (ngModelChange)="loadPayslips()"><option value="all">All years</option>@for (year of availableYears; track year) { <option [ngValue]="year">{{ year }}</option> }</select>
        </div>
      }
    @if (loading) {
      <p>Loading payslips…</p>
    } @else if (error) {
      <p class="error">{{ error }}</p>
    } @else {
      <app-data-table [columns]="columns" [rows]="rows" (edit)="editPayslip($event)" (delete)="onDelete($event)" (pdf)="downloadPdf($event)" />
    }
  `,
  styles: [`
    .error { color: #c0392b; }
    .salary-panel { background: #fff; border: 1px solid #e2e2e8; border-radius: 8px; margin-bottom: 16px; padding: 18px; }
    .salary-heading { align-items: start; display: flex; justify-content: space-between; gap: 16px; margin-bottom: 14px; flex-wrap: wrap; }
    .salary-heading h2 { color: #292934; font-size: 17px; margin: 0; }
    .salary-heading p { color: #6b6b76; font-size: 13px; margin: 5px 0 0; max-width: 520px; }
    .salary-heading select { border: 1px solid #dedee5; border-radius: 5px; padding: 8px 10px; }
    .salary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 12px; }
    .salary-grid label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #47474d; }
    .salary-grid input, .generate-row input, .generate-row select { border: 1px solid #e6e6e6; border-radius: 6px; padding: 8px 10px; font-size: 13px; font: inherit; }
    .salary-actions { align-items: center; display: flex; gap: 12px; margin-bottom: 16px; }
    .gross { color: #292934; font-size: 13px; }
    .generate-row { align-items: center; border-top: 1px solid #eee; display: flex; gap: 10px; padding-top: 14px; }
    .generate-row input { width: 100px; }
    .generate-row select { min-width: 150px; }
    .btn { align-items: center; border: 0; border-radius: 6px; cursor: pointer; display: inline-flex; font: inherit; font-size: 12px; gap: 5px; padding: 8px 12px; }
    .btn--secondary { background: #eef0fd; color: #464feb; }
    .btn--primary { background: #464feb; color: #fff; }
    .edit-banner { align-items: center; background: #eef0ff; border: 1px solid #c3c8ff; border-radius: 6px; color: #3b41c4; display: flex; font-size: 12px; gap: 10px; margin-bottom: 12px; padding: 8px 10px; }
  `],
})
export class PayslipList implements OnInit {
  private hrService = inject(HrService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private payslipPdf = inject(PayslipPdfService);

  monthNames = MONTH_NAMES;
  private managerColumns: TableColumn[] = [
    { key: 'employeeName', label: 'Employee', type: 'link' },
    { key: 'period', label: 'Period' },
    { key: 'grossSalary', label: 'Gross', type: 'currency' },
    { key: 'lopDays', label: 'LOP Days' },
    { key: 'paidDays', label: 'Paid Days' },
    { key: 'totalDeductions', label: 'Deductions', type: 'currency' },
    { key: 'netPay', label: 'Net Pay', type: 'currency' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'rowActions', label: '', type: 'invoice-actions' },
    { key: 'actions', label: '', type: 'actions' },
  ];
  columns: TableColumn[] = [];

  employees: Employee[] = [];
  payslips: PayslipRow[] = [];
  rows: PayslipRow[] = [];
  loading = false;
  error = '';

  selectedEmployeeId = 0;
  salary: Partial<EmployeeSalary> = this.emptySalary();
  genMonth = new Date().getMonth() + 1;
  genYear = new Date().getFullYear();
  filterMonth: number | 'all' = new Date().getMonth() + 1;
  filterYear: number | 'all' = new Date().getFullYear();
  availableYears = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];
  genCurrency = 'INR';
  currencies = [
    { code: 'INR', name: 'Indian Rupee' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'AED', name: 'UAE Dirham' },
  ];
  editingPayslip: PayslipRow | null = null;

  get canManagePayroll() {
    const user = this.auth.currentUser();
    return !!user?.roles?.some((role) => ['Administrator', 'Admin', 'HR Manager'].includes(role));
  }

  get currentEmployeeName() {
    return this.employees.find((employee) => employee.id === this.selectedEmployeeId)?.name ?? 'Employee';
  }

  ngOnInit() {
    this.columns = this.canManagePayroll ? this.managerColumns : [
      { key: 'employeeName', label: 'Employee', type: 'link' },
      { key: 'period', label: 'Period' },
      { key: 'grossSalary', label: 'Gross', type: 'currency' },
      { key: 'lopDays', label: 'LOP Days' },
      { key: 'paidDays', label: 'Paid Days' },
      { key: 'totalDeductions', label: 'Deductions', type: 'currency' },
      { key: 'netPay', label: 'Net Pay', type: 'currency' },
      { key: 'status', label: 'Status', type: 'badge' },
      { key: 'rowActions', label: '', type: 'invoice-actions' },
    ];
    this.loadEmployees();
  }

  get grossMonthly(): number {
    return (Number(this.salary.basic) || 0) + (Number(this.salary.hra) || 0) + (Number(this.salary.conveyance) || 0)
      + (Number(this.salary.medicalAllowance) || 0) + (Number(this.salary.specialAllowance) || 0) + (Number(this.salary.otherAllowance) || 0);
  }

  loadEmployees() {
    this.hrService.getAll().subscribe({
      next: (employees) => {
        this.employees = employees.filter((e) => e.status === 'Active');
        const user = this.auth.currentUser();
        if (!this.canManagePayroll) {
          const own = this.employees.find((employee) => employee.email?.toLowerCase() === user?.username?.toLowerCase() || employee.name.toLowerCase() === user?.displayName?.toLowerCase());
          this.selectedEmployeeId = own?.id ?? 0;
        } else if (!this.selectedEmployeeId) {
          this.selectedEmployeeId = this.employees[0]?.id ?? 0;
        }
        this.onEmployeeChange();
        this.loadPayslips();
      },
      error: () => { this.error = 'Failed to load employees. Is the HR API running?'; },
    });
  }

  loadPayslips() {
    if (!this.selectedEmployeeId || !this.genMonth || !this.genYear) return;
    this.loading = true;
    this.error = '';
    this.hrService.getPayslips().subscribe({
      next: (payslips) => {
        const employeeMap = new Map(this.employees.map((e) => [e.id, e.name]));
        this.rows = payslips
          .filter((p) => this.filterMonth === 'all' || p.month === this.filterMonth)
          .filter((p) => this.filterYear === 'all' || p.year === this.filterYear)
          .filter((p) => this.canManagePayroll || p.employeeId === this.selectedEmployeeId)
          .map((p) => ({ ...p, employeeName: employeeMap.get(p.employeeId) ?? `Employee #${p.employeeId}`, period: `${MONTH_NAMES[p.month - 1]} ${p.year}` }));
        this.loading = false;
      },
      error: () => { this.error = 'Failed to load payslips.'; this.loading = false; },
    });
  }

  onEmployeeChange() {
    if (!this.selectedEmployeeId) return;
    this.hrService.getSalary(this.selectedEmployeeId).subscribe({
      next: (salary) => this.salary = salary,
      error: () => this.salary = this.emptySalary(),
    });
  }

  saveSalary() {
    this.hrService.saveSalary({ ...this.salary, employeeId: this.selectedEmployeeId }).subscribe({
      next: (salary) => { this.salary = salary; this.toast.success('Salary structure saved.'); },
      error: (error) => this.toast.error(error?.error?.message ?? 'Failed to save the salary structure.'),
    });
  }

  generate() {
    this.hrService.generatePayslip({ employeeId: this.selectedEmployeeId, month: this.genMonth, year: this.genYear, currency: this.genCurrency }).subscribe({
      next: () => {
        this.filterMonth = this.genMonth;
        this.filterYear = this.genYear;
        this.toast.success('Payslip generated.');
        this.loadPayslips();
      },
      error: (error) => this.toast.error(error?.error?.message ?? 'Failed to generate the payslip.'),
    });
  }

  onDelete(row: PayslipRow) {
    if (!confirm(`Delete payslip for ${row.employeeName} (${row.period})?`)) return;
    this.hrService.deletePayslip(row.id).subscribe({
      next: () => { this.toast.success('Payslip deleted.'); this.loadPayslips(); },
      error: () => this.toast.error('Failed to delete the payslip.'),
    });
  }

  downloadPdf(row: PayslipRow) {
    const employee = this.employees.find((e) => e.id === row.employeeId);
    this.payslipPdf.download(row, employee);
  }

  editPayslip(row: PayslipRow) {
    this.editingPayslip = row;
    this.selectedEmployeeId = row.employeeId;
    this.genMonth = row.month;
    this.genYear = row.year;
    this.genCurrency = row.currency ?? 'INR';
    this.onEmployeeChange();
    this.toast.success(`Editing ${row.employeeName}'s salary structure for ${row.period}.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.editingPayslip = null;
  }

  private emptySalary(): Partial<EmployeeSalary> {
    return { basic: 0, hra: 0, conveyance: 0, medicalAllowance: 0, specialAllowance: 0, otherAllowance: 0, pfPercentage: 12, professionalTax: 200, tds: 0 };
  }
}
