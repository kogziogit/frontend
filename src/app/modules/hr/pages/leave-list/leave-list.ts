import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, Observable } from 'rxjs';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { DataTable, TableColumn } from '../../../../shared/ui/data-table/data-table';
import { EntityFormModal } from '../../../../shared/ui/entity-form-modal/entity-form-modal';
import { EntityFormField } from '../../../../shared/ui/entity-form-modal/entity-form-field';
import { Employee } from '../../data/employees.mock';
import { HrService, LeaveBalance, LeaveRequest } from '../../services/hr.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

interface LeaveRow extends LeaveRequest {
  employeeName: string;
  department: string;
}

@Component({
  selector: 'app-leave-list',
  standalone: true,
  imports: [CommonModule, PageHeader, DataTable, EntityFormModal],
  template: `
    <app-page-header
      title="Leave Requests"
      subtitle="Request, review, and track employee time off"
      createLabel="Request Leave"
      (search)="onSearch($event)"
      (create)="openCreate()"
    />
    @if (loading) {
      <p>Loading leave requests...</p>
    } @else if (error) {
      <p class="error">{{ error }}</p>
    } @else {
      <section class="balance-panel">
        <div class="balance-heading">
          <div><h2>Leave balance and requests</h2><p>Select an employee to view their balance and leave requests.</p></div>
          <div class="balance-actions">
            <select [value]="selectedEmployeeId" (change)="selectEmployee($any($event.target).value)">
              @for (employee of activeEmployees; track employee.id) { <option [value]="employee.id">{{ employee.name }}</option> }
            </select>
            <button class="btn btn--secondary" type="button" (click)="openAdjustment()"><span class="material-symbols-outlined">tune</span> Adjust balance</button>
          </div>
        </div>
        <div class="balance-grid">
          @for (balance of balances; track balance.leaveType) {
            <article class="balance-card">
              <span>{{ balance.leaveType }}</span>
              <strong>{{ balance.remainingDays }} days remaining</strong>
              <small>{{ balance.accruedDays }} accrued of {{ balance.annualEntitlement }} annual entitlement</small>
              <small>{{ balance.approvedDays }} approved · {{ balance.pendingDays }} pending</small>
            </article>
          }
        </div>
      </section>
      <app-data-table [columns]="columns" [rows]="filteredRows" (edit)="openEdit($event)" (delete)="onDelete($event)" (approve)="approve($event)" (refuse)="refuse($event)" />
    }
    @if (showForm) {
      <app-entity-form-modal
        [title]="editingRow ? 'Edit Leave Request' : 'Request Leave'"
        [fields]="fields"
        [model]="editingRow"
        (save)="onSave($event)"
        (cancel)="showForm = false"
      />
    }
    @if (showAdjustmentForm) {
      <app-entity-form-modal
        title="Adjust Leave Balance"
        [fields]="adjustmentFields"
        (save)="saveAdjustment($event)"
        (cancel)="showAdjustmentForm = false"
      />
    }
  `,
  styles: [`
    .error { color: #c0392b; }
    .balance-panel { background: #fff; border: 1px solid #e2e2e8; border-radius: 8px; margin-bottom: 16px; padding: 18px; }
    .balance-heading { align-items: start; display: flex; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
    .balance-heading h2 { color: #292934; font-size: 17px; margin: 0; }
    .balance-heading p { color: #6b6b76; font-size: 13px; margin: 5px 0 0; }
    .balance-heading select { border: 1px solid #dedee5; border-radius: 5px; padding: 8px 10px; }
    .balance-actions { align-items: center; display: flex; flex-wrap: wrap; gap: 8px; }
    .btn { align-items: center; border: 0; border-radius: 6px; cursor: pointer; display: inline-flex; font: inherit; font-size: 12px; gap: 5px; padding: 8px 11px; }
    .btn--secondary { background: #eef0fd; color: #464feb; }
    .btn .material-symbols-outlined { font-size: 16px; }
    .balance-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .balance-card { background: #f7f7fa; border: 1px solid #e8e8ed; border-radius: 6px; display: grid; gap: 5px; padding: 14px; }
    .balance-card span, .balance-card small { color: #6b6b76; font-size: 12px; }
    .balance-card strong { color: #292934; font-size: 18px; }
    @media (max-width: 700px) { .balance-heading { flex-direction: column; } .balance-grid { grid-template-columns: 1fr; } }
  `],
})
export class LeaveList implements OnInit {
  private hrService = inject(HrService);
  private toast = inject(ToastService);

  columns: TableColumn[] = [
    { key: 'employeeName', label: 'Employee', type: 'link' },
    { key: 'leaveType', label: 'Leave Type' },
    { key: 'startDate', label: 'From', type: 'date' },
    { key: 'endDate', label: 'To', type: 'date' },
    { key: 'days', label: 'Days' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'workflow', label: '', type: 'workflow' },
    { key: 'actions', label: '', type: 'actions' },
  ];

  fields: EntityFormField[] = [
    {
      key: 'employeeId', label: 'Employee', type: 'select', required: true,
      options: [{ value: '', label: 'Select an employee' }],
    },
    {
      key: 'leaveType', label: 'Leave Type', type: 'select', required: true,
      options: [
        { value: 'Casual Leave', label: 'Casual Leave' },
        { value: 'Sick Leave', label: 'Sick Leave' },
        { value: 'Personal Leave', label: 'Personal Leave' },
        { value: 'Unpaid Leave', label: 'Unpaid Leave' },
      ],
    },
    { key: 'startDate', label: 'Start Date', type: 'date', required: true },
    { key: 'endDate', label: 'End Date', type: 'date', required: true },
    { key: 'reason', label: 'Reason', type: 'text', required: true },
    {
      key: 'status', label: 'Status', type: 'select', required: true,
      options: [
        { value: 'Pending', label: 'Pending' },
        { value: 'Approved', label: 'Approved' },
        { value: 'Refused', label: 'Refused' },
        { value: 'Cancelled', label: 'Cancelled' },
      ],
    },
  ];

  allRows: LeaveRow[] = [];
  filteredRows: LeaveRow[] = [];
  loading = true;
  error = '';
  showForm = false;
  editingRow: LeaveRow | null = null;
  activeEmployees: Employee[] = [];
  selectedEmployeeId = 0;
  balances: LeaveBalance[] = [];
  searchTerm = '';
  showAdjustmentForm = false;
  adjustmentFields: EntityFormField[] = [
    {
      key: 'leaveType', label: 'Leave Type', type: 'select', required: true,
      options: [{ value: 'Casual Leave', label: 'Casual Leave' }, { value: 'Sick Leave', label: 'Sick Leave' }],
    },
    { key: 'days', label: 'Adjustment Days (+ grant / - deduction)', type: 'number', required: true },
    { key: 'reason', label: 'Reason', type: 'text', required: true },
  ];

  ngOnInit() { this.loadData(); }

  loadData() {
    this.loading = true;
    forkJoin({ requests: this.hrService.getLeaveRequests(), employees: this.hrService.getAll() }).subscribe({
      next: ({ requests, employees }) => {
        const employeeMap = new Map(employees.map((employee) => [employee.id, employee]));
        this.activeEmployees = employees.filter((employee) => employee.status === 'Active');
        if (!this.selectedEmployeeId) this.selectedEmployeeId = this.activeEmployees[0]?.id ?? 0;
        this.loadBalances();
        this.setEmployeeOptions(employees);
        this.allRows = requests.map((request) => this.toRow(request, employeeMap.get(request.employeeId)));
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load leave requests. Is the HR API running and the leave table created?';
        this.loading = false;
      },
    });
  }

  onSearch(term: string) {
    this.searchTerm = term.toLowerCase();
    this.applyFilters();
  }

  openCreate() { this.editingRow = null; this.showForm = true; }
  openEdit(row: LeaveRow) { this.editingRow = row; this.showForm = true; }

  selectEmployee(id: string) {
    this.selectedEmployeeId = Number(id);
    this.loadBalances();
    this.applyFilters();
  }

  openAdjustment() {
    if (!this.selectedEmployeeId) {
      this.toast.error('Select an employee before adjusting a balance.');
      return;
    }
    this.showAdjustmentForm = true;
  }

  saveAdjustment(value: Record<string, unknown>) {
    this.hrService.addLeaveBalanceAdjustment({
      employeeId: this.selectedEmployeeId,
      year: new Date().getFullYear(),
      leaveType: String(value['leaveType']),
      days: Number(value['days']),
      reason: String(value['reason']),
    }).subscribe({
      next: () => { this.showAdjustmentForm = false; this.toast.success('Leave balance adjusted.'); this.loadBalances(); },
      error: (error) => this.toast.error(error?.error?.message ?? 'Failed to adjust the leave balance.'),
    });
  }

  onSave(value: Record<string, unknown>) {
    const request = { ...value, employeeId: Number(value['employeeId']) } as Partial<LeaveRequest>;
    const operation: Observable<unknown> = this.editingRow
      ? this.hrService.updateLeaveRequest(this.editingRow.id, { ...this.editingRow, ...request } as LeaveRequest)
      : this.hrService.createLeaveRequest(request);
    operation.subscribe({
      next: () => {
        this.showForm = false;
        this.toast.success(this.editingRow ? 'Leave request updated.' : 'Leave request submitted for approval.');
        this.loadData();
      },
      error: (error) => this.toast.error(error?.error?.message ?? 'Failed to save the leave request.'),
    });
  }

  onDelete(row: LeaveRow) {
    if (!confirm(`Delete leave request for ${row.employeeName}?`)) return;
    this.hrService.deleteLeaveRequest(row.id).subscribe({
      next: () => { this.toast.success('Leave request deleted.'); this.loadData(); },
      error: () => this.toast.error('Failed to delete the leave request.'),
    });
  }

  approve(row: LeaveRow) { this.changeStatus(row, 'Approved'); }
  refuse(row: LeaveRow) { this.changeStatus(row, 'Refused'); }

  private changeStatus(row: LeaveRow, status: LeaveRequest['status']) {
    this.hrService.updateLeaveRequest(row.id, { ...row, status }).subscribe({
      next: () => { this.toast.success(`Leave request ${status.toLowerCase()}.`); this.loadData(); },
      error: (error) => this.toast.error(error?.error?.message ?? 'Failed to update the leave request.'),
    });
  }

  private setEmployeeOptions(employees: Employee[]) {
    const field = this.fields.find((item) => item.key === 'employeeId');
    if (field) field.options = [
      { value: '', label: 'Select an employee' },
      ...employees.filter((employee) => employee.status === 'Active').map((employee) => ({ value: String(employee.id), label: `${employee.name} - ${employee.department}` })),
    ];
  }

  private loadBalances() {
    if (!this.selectedEmployeeId) return;
    this.hrService.getLeaveBalances(this.selectedEmployeeId).subscribe({
      next: (balances) => this.balances = balances,
      error: () => this.toast.error('Failed to load leave balances.'),
    });
  }

  private applyFilters() {
    this.filteredRows = this.allRows.filter((row) => {
      const employeeMatches = !this.selectedEmployeeId || row.employeeId === this.selectedEmployeeId;
      const text = `${row.employeeName} ${row.department} ${row.leaveType} ${row.status}`.toLowerCase();
      return employeeMatches && text.includes(this.searchTerm);
    });
  }

  private toRow(request: LeaveRequest, employee?: Employee): LeaveRow {
    return { ...request, employeeName: employee?.name ?? `Employee #${request.employeeId}`, department: employee?.department ?? '' };
  }
}
