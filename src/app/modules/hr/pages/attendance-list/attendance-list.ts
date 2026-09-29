import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { DataTable, TableColumn } from '../../../../shared/ui/data-table/data-table';
import { EntityFormModal } from '../../../../shared/ui/entity-form-modal/entity-form-modal';
import { EntityFormField } from '../../../../shared/ui/entity-form-modal/entity-form-field';
import { Employee } from '../../data/employees.mock';
import { HrService } from '../../services/hr.service';
import { HrmsService, AttendanceRecord } from '../../services/hrms.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

interface AttendanceRow extends AttendanceRecord {
  employeeName: string;
}

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeader, DataTable, EntityFormModal],
  template: `
    <app-page-header title="Attendance" subtitle="Submit daily attendance for manager approval" createLabel="New Record" (search)="onSearch($event)" (create)="openCreate()" />
    <div class="filters">
      <label>From<input type="date" [(ngModel)]="fromDate" (ngModelChange)="applyFilters()" /></label>
      <label>To<input type="date" [(ngModel)]="toDate" (ngModelChange)="applyFilters()" /></label>
      <label>Employee<select [(ngModel)]="employeeFilter" (ngModelChange)="applyFilters()">
        <option value="all">All employees</option>
        @for (employee of employees; track employee.id) { <option [ngValue]="employee.id">{{ employee.name }}</option> }
      </select></label>
    </div>
    @if (loading) {
      <p>Loading attendance…</p>
    } @else if (error) {
      <p class="error">{{ error }}</p>
    } @else {
      <app-data-table [columns]="columns" [rows]="filteredRows" (edit)="openEdit($event)" (delete)="onDelete($event)" (approve)="approve($event)" (refuse)="reject($event)" />
    }
    @if (showForm) {
      <app-entity-form-modal
        [title]="editingRow ? 'Edit Record' : 'New Record'"
        [fields]="fields"
        [model]="editingRow"
        (save)="onSave($event)"
        (cancel)="showForm = false"
      />
    }
  `,
  styles: [`.error { color: #c0392b; } .filters { align-items: end; display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; } .filters label { color: #6b6b76; display: flex; flex-direction: column; font-size: 12px; gap: 4px; } .filters input, .filters select { border: 1px solid #dedee5; border-radius: 5px; font: inherit; padding: 7px 9px; }`],
})
export class AttendanceList implements OnInit {
  private hrmsService = inject(HrmsService);
  private hrService = inject(HrService);
  private toast = inject(ToastService);

  columns: TableColumn[] = [
    { key: 'employeeName', label: 'Employee', type: 'link' },
    { key: 'attendanceDate', label: 'Date', type: 'date' },
    { key: 'checkIn', label: 'Check In' },
    { key: 'checkOut', label: 'Check Out' },
    { key: 'workHours', label: 'Hours' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'approvalStatus', label: 'Approval', type: 'badge' },
    { key: 'approvalStatus', label: '', type: 'workflow' },
    { key: 'actions', label: '', type: 'actions' },
  ];

  fields: EntityFormField[] = [
    { key: 'employeeId', label: 'Employee', type: 'select', required: true, options: [] },
    { key: 'attendanceDate', label: 'Date', type: 'date', required: true },
    { key: 'checkIn', label: 'Check In', type: 'time', required: true },
    { key: 'checkOut', label: 'Check Out', type: 'time', required: true },
    {
      key: 'status', label: 'Status', type: 'select', required: true,
      options: [
        { value: 'Present', label: 'Present' },
        { value: 'Absent', label: 'Absent' },
        { value: 'Half Day', label: 'Half Day' },
        { value: 'Work From Home', label: 'Work From Home' },
        { value: 'On Leave', label: 'On Leave' },
      ],
    },
    { key: 'notes', label: 'Notes', type: 'text' },
  ];

  employees: Employee[] = [];
  allRows: AttendanceRow[] = [];
  filteredRows: AttendanceRow[] = [];
  loading = true;
  error = '';
  showForm = false;
  editingRow: AttendanceRow | null = null;
  fromDate = '';
  toDate = '';
  employeeFilter: number | 'all' = 'all';

  ngOnInit() {
    this.hrService.getAll().subscribe((employees) => {
      this.employees = employees.filter((e) => e.status === 'Active');
      const field = this.fields.find((f) => f.key === 'employeeId');
      if (field) field.options = this.employees.map((e) => ({ value: String(e.id), label: e.name }));
      this.loadData();
    });
  }

  loadData() {
    this.loading = true;
    this.hrmsService.getAttendance().subscribe({
      next: (data) => {
        const employeeMap = new Map(this.employees.map((e) => [e.id, e.name]));
        this.allRows = data.map((r) => ({ ...r, employeeName: employeeMap.get(r.employeeId) ?? `Employee #${r.employeeId}` }));
        this.applyFilters();
        this.loading = false;
      },
      error: () => { this.error = 'Failed to load attendance records.'; this.loading = false; },
    });
  }

  onSearch(term: string) {
    const t = term.toLowerCase();
    this.filteredRows = this.allRows.filter((r) => `${r.employeeName} ${r.status}`.toLowerCase().includes(t));
  }

  applyFilters() {
    const from = this.fromDate || '0000-01-01';
    const to = this.toDate || '9999-12-31';
    this.filteredRows = this.allRows.filter((row) =>
      row.attendanceDate >= from && row.attendanceDate <= to &&
      (this.employeeFilter === 'all' || row.employeeId === this.employeeFilter)
    );
  }

  openCreate() { this.editingRow = null; this.showForm = true; }
  openEdit(row: AttendanceRow) { this.editingRow = row; this.showForm = true; }

  approve(row: AttendanceRow) {
    this.hrmsService.approveAttendance(row.id).subscribe({
      next: () => { this.toast.success('Attendance approved.'); this.loadData(); },
      error: (err) => this.toast.error(err?.error?.message ?? 'Failed to approve attendance.'),
    });
  }

  reject(row: AttendanceRow) {
    const reason = prompt('Reason for rejecting this attendance?', 'Please correct the attendance details.');
    if (reason === null) return;
    this.hrmsService.rejectAttendance(row.id, reason).subscribe({
      next: () => { this.toast.success('Attendance rejected.'); this.loadData(); },
      error: (err) => this.toast.error(err?.error?.message ?? 'Failed to reject attendance.'),
    });
  }

  onSave(value: Record<string, unknown>) {
    const record = { ...value, employeeId: Number(value['employeeId']) };
    if (this.editingRow) {
      const updated = { ...this.editingRow, ...record } as AttendanceRecord;
      this.hrmsService.updateAttendance(this.editingRow.id, updated).subscribe({
        next: () => { this.showForm = false; this.toast.success('Attendance updated.'); this.loadData(); },
        error: (error) => this.toast.error(error?.error?.message ?? 'Failed to update the record.'),
      });
    } else {
      this.hrmsService.createAttendance(record).subscribe({
        next: () => { this.showForm = false; this.toast.success('Attendance recorded.'); this.loadData(); },
        error: (error) => this.toast.error(error?.error?.message ?? 'Failed to save the record.'),
      });
    }
  }

  onDelete(row: AttendanceRow) {
    if (!confirm('Delete this attendance record?')) return;
    this.hrmsService.deleteAttendance(row.id).subscribe({
      next: () => { this.toast.success('Record deleted.'); this.loadData(); },
      error: () => this.toast.error('Failed to delete the record.'),
    });
  }
}
