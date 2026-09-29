import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { DataTable, TableColumn } from '../../../../shared/ui/data-table/data-table';
import { EntityFormModal } from '../../../../shared/ui/entity-form-modal/entity-form-modal';
import { EntityFormField } from '../../../../shared/ui/entity-form-modal/entity-form-field';
import { TimesheetEntry } from '../../data/timesheet.mock';
import { TimesheetService } from '../../services/timesheet.service';
import { HrService } from '../../../hr/services/hr.service';
import { AccountingService } from '../../../accounting/services/accounting.service';
import { Employee } from '../../../hr/data/employees.mock';
import { Customer } from '../../../accounting/data/customers.mock';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

interface TimesheetRow extends TimesheetEntry {
  employeeName: string;
  amountValue: number;
}

@Component({
  selector: 'app-timesheet-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeader, DataTable, EntityFormModal],
  template: `
    <app-page-header title="Timesheet" subtitle="Log hours & bill customers" createLabel="New Entry" (search)="onSearch($event)" (create)="openCreate()" />

    <section class="invoice-panel">
      <div><h2>Generate invoice from timesheet</h2><p>Bills all uninvoiced, billable entries for the selected customer.</p></div>
      <div class="invoice-actions">
        <select [(ngModel)]="invoiceCustomer">
          <option value="">Select a customer</option>
          @for (customer of customers; track customer.id) { <option [ngValue]="customer.name">{{ customer.name }}</option> }
        </select>
        <button class="btn btn--primary" type="button" (click)="generateInvoice()">Generate Invoice</button>
      </div>
    </section>

    @if (loading) {
      <p>Loading timesheet entries…</p>
    } @else if (error) {
      <p class="error">{{ error }}</p>
    } @else {
      <app-data-table [columns]="columns" [rows]="filteredRows" (edit)="openEdit($event)" (delete)="onDelete($event)" />
    }
    @if (showForm) {
      <app-entity-form-modal
        [title]="editingRow ? 'Edit Entry' : 'New Entry'"
        [fields]="fields"
        [model]="editingRow"
        (save)="onSave($event)"
        (cancel)="showForm = false"
      />
    }
  `,
  styles: [`
    .error { color: #c0392b; }
    .invoice-panel { align-items: center; background: #fff; border: 1px solid #e2e2e8; border-radius: 8px; display: flex; gap: 16px; justify-content: space-between; margin-bottom: 16px; padding: 16px 18px; flex-wrap: wrap; }
    .invoice-panel h2 { color: #292934; font-size: 16px; margin: 0; }
    .invoice-panel p { color: #6b6b76; font-size: 12px; margin: 4px 0 0; }
    .invoice-actions { align-items: center; display: flex; gap: 10px; }
    .invoice-actions select { border: 1px solid #dedee5; border-radius: 5px; padding: 8px 10px; }
    .btn { border: 0; border-radius: 6px; cursor: pointer; font: inherit; font-size: 12px; padding: 8px 12px; }
    .btn--primary { background: #464feb; color: #fff; }
  `],
})
export class TimesheetList implements OnInit {
  private timesheetService = inject(TimesheetService);
  private hrService = inject(HrService);
  private accountingService = inject(AccountingService);
  private toast = inject(ToastService);

  columns: TableColumn[] = [
    { key: 'employeeName', label: 'Employee', type: 'link' },
    { key: 'customer', label: 'Customer' },
    { key: 'project', label: 'Project' },
    { key: 'workDate', label: 'Date', type: 'date' },
    { key: 'hours', label: 'Hours' },
    { key: 'amountValue', label: 'Amount', type: 'currency' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'invoiceNo', label: 'Invoice No' },
    { key: 'actions', label: '', type: 'actions' },
  ];

  fields: EntityFormField[] = [
    { key: 'employeeId', label: 'Employee', type: 'select', required: true, options: [] },
    { key: 'customer', label: 'Customer', type: 'select', required: true, options: [] },
    { key: 'project', label: 'Project', type: 'text', required: true },
    { key: 'taskDescription', label: 'Task Description', type: 'text', required: true },
    { key: 'workDate', label: 'Date', type: 'date', required: true },
    { key: 'hours', label: 'Hours', type: 'number', required: true },
    { key: 'ratePerHour', label: 'Rate per Hour', type: 'number', required: true },
    {
      key: 'billable', label: 'Billable', type: 'select', required: true,
      options: [{ value: 'true', label: 'Billable' }, { value: 'false', label: 'Non-billable' }],
    },
    {
      key: 'status', label: 'Status', type: 'select', required: true,
      options: [
        { value: 'Draft', label: 'Draft' },
        { value: 'Submitted', label: 'Submitted' },
        { value: 'Approved', label: 'Approved' },
        { value: 'Invoiced', label: 'Invoiced' },
      ],
    },
  ];

  employees: Employee[] = [];
  customers: Customer[] = [];
  allRows: TimesheetRow[] = [];
  filteredRows: TimesheetRow[] = [];
  loading = true;
  error = '';
  showForm = false;
  editingRow: TimesheetRow | null = null;
  invoiceCustomer = '';

  ngOnInit() {
    this.hrService.getAll().subscribe((employees) => {
      this.employees = employees.filter((e) => e.status === 'Active');
      const field = this.fields.find((f) => f.key === 'employeeId');
      if (field) field.options = this.employees.map((e) => ({ value: String(e.id), label: e.name }));
      this.loadData();
    });
    this.accountingService.getCustomers().subscribe((customers) => {
      this.customers = customers.filter((c) => c.status === 'Active');
      const field = this.fields.find((f) => f.key === 'customer');
      if (field) field.options = this.customers.map((c) => ({ value: c.name, label: c.name }));
    });
  }

  loadData() {
    this.loading = true;
    this.timesheetService.getAll().subscribe({
      next: (data) => {
        const employeeMap = new Map(this.employees.map((e) => [e.id, e.name]));
        this.allRows = data.map((entry) => ({ ...entry, employeeName: employeeMap.get(entry.employeeId) ?? `Employee #${entry.employeeId}`, amountValue: entry.amount ?? entry.hours * entry.ratePerHour }));
        this.filteredRows = this.allRows;
        this.loading = false;
      },
      error: () => { this.error = 'Failed to load timesheet entries. Is the Timesheet API running?'; this.loading = false; },
    });
  }

  onSearch(term: string) {
    const t = term.toLowerCase();
    this.filteredRows = this.allRows.filter((r) => `${r.employeeName} ${r.customer} ${r.project}`.toLowerCase().includes(t));
  }

  openCreate() { this.editingRow = null; this.showForm = true; }
  openEdit(row: TimesheetRow) { this.editingRow = row; this.showForm = true; }

  onSave(value: Record<string, unknown>) {
    const entry = { ...value, employeeId: Number(value['employeeId']), billable: value['billable'] === 'true' || value['billable'] === true };
    if (this.editingRow) {
      const updated = { ...this.editingRow, ...entry } as TimesheetEntry;
      this.timesheetService.update(this.editingRow.id, updated).subscribe({
        next: () => { this.showForm = false; this.toast.success('Timesheet entry updated.'); this.loadData(); },
        error: () => this.toast.error('Failed to update the entry.'),
      });
    } else {
      this.timesheetService.create(entry).subscribe({
        next: () => { this.showForm = false; this.toast.success('Timesheet entry logged.'); this.loadData(); },
        error: () => this.toast.error('Failed to create the entry.'),
      });
    }
  }

  onDelete(row: TimesheetRow) {
    if (!confirm(`Delete this timesheet entry?`)) return;
    this.timesheetService.delete(row.id).subscribe({
      next: () => { this.toast.success('Entry deleted.'); this.loadData(); },
      error: () => this.toast.error('Failed to delete the entry.'),
    });
  }

  generateInvoice() {
    if (!this.invoiceCustomer) { this.toast.error('Select a customer first.'); return; }
    const billable = this.allRows.filter((r) => r.customer === this.invoiceCustomer && r.billable && r.status !== 'Invoiced');
    if (!billable.length) { this.toast.error('No uninvoiced billable entries for this customer.'); return; }

    const items = billable.map((entry) => ({
      serviceDescription: `${entry.project} - ${entry.taskDescription}`,
      hsnSac: '998313',
      qty: entry.hours,
      rate: entry.ratePerHour,
      amount: entry.amountValue,
    }));
    const amount = items.reduce((sum, i) => sum + i.amount, 0);
    const invoiceNo = `TS-${this.invoiceCustomer.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    this.accountingService.create({
      invoiceNo, customer: this.invoiceCustomer, dueDate, currency: 'USD', status: 'Pending', amount, items,
      serviceDescription: items[0]?.serviceDescription ?? '', hsnSac: '998313',
    }).subscribe({
      next: () => {
        this.timesheetService.markInvoiced(billable.map((b) => b.id), invoiceNo).subscribe({
          next: () => { this.toast.success(`Invoice ${invoiceNo} generated from ${billable.length} entries.`); this.loadData(); },
          error: () => this.toast.error('Invoice created, but failed to mark entries as invoiced.'),
        });
      },
      error: () => this.toast.error('Failed to generate the invoice.'),
    });
  }
}
