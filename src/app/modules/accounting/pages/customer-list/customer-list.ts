import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { DataTable, TableColumn } from '../../../../shared/ui/data-table/data-table';
import { EntityFormModal } from '../../../../shared/ui/entity-form-modal/entity-form-modal';
import { EntityFormField } from '../../../../shared/ui/entity-form-modal/entity-form-field';
import { Customer } from '../../data/customers.mock';
import { AccountingService } from '../../services/accounting.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-customer-list', standalone: true,
  imports: [CommonModule, PageHeader, DataTable, EntityFormModal],
  template: `
    <app-page-header title="Clients" subtitle="Customer master and billing contacts" createLabel="New Client" (search)="onSearch($event)" (create)="openCreate()" />
    @if (loading) { <p>Loading clients...</p> } @else if (error) { <p class="error">{{ error }}</p> } @else {
      <app-data-table [columns]="columns" [rows]="filteredRows" (edit)="openEdit($event)" (delete)="onDelete($event)" />
    }
    @if (showForm) {
      <app-entity-form-modal [title]="editingRow ? 'Edit Client' : 'New Client'" [fields]="fields" [model]="editingRow" (save)="onSave($event)" (cancel)="showForm = false" />
    }
  `,
  styles: [`.error { color: #c0392b; }`],
})
export class CustomerList implements OnInit {
  private service = inject(AccountingService);
  private toast = inject(ToastService);
  columns: TableColumn[] = [
    { key: 'name', label: 'Client', type: 'link' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' },
    { key: 'invoicePrefix', label: 'Invoice Prefix' }, { key: 'pan', label: 'PAN' }, { key: 'gst', label: 'GST' }, { key: 'status', label: 'Status', type: 'badge' }, { key: 'actions', label: '', type: 'actions' },
  ];
  fields: EntityFormField[] = [
    { key: 'name', label: 'Client Name', type: 'text', required: true },
    { key: 'email', label: 'Email (optional)', type: 'email' },
    { key: 'phone', label: 'Phone (optional)', type: 'text' },
    { key: 'addressLine1', label: 'Address Line 1', type: 'text', required: true },
    { key: 'addressLine2', label: 'Address Line 2 (optional)', type: 'text' },
    { key: 'addressLine3', label: 'Address Line 3 (optional)', type: 'text' },
    { key: 'invoicePrefix', label: 'Invoice Prefix (e.g. KZ-501)', type: 'text' },
    { key: 'pan', label: 'PAN (optional)', type: 'text' },
    { key: 'gst', label: 'GST (optional)', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }] },
  ];
  allRows: Customer[] = []; filteredRows: Customer[] = []; loading = true; error = ''; showForm = false; editingRow: Customer | null = null;
  ngOnInit() { this.loadData(); }
  loadData() { this.service.getCustomers().subscribe({ next: (rows) => { this.allRows = rows; this.filteredRows = rows; this.loading = false; }, error: () => { this.error = 'Failed to load clients. Is the backend running?'; this.loading = false; } }); }
  onSearch(term: string) { const query = term.toLowerCase(); this.filteredRows = this.allRows.filter((row) => `${row.name} ${row.email ?? ''} ${row.phone ?? ''} ${row.pan ?? ''} ${row.gst ?? ''}`.toLowerCase().includes(query)); }
  openCreate() { this.editingRow = null; this.showForm = true; }
  openEdit(row: Customer) { this.editingRow = row; this.showForm = true; }
  onSave(value: Record<string, unknown>) {
    const request: Observable<unknown> = this.editingRow ? this.service.updateCustomer(this.editingRow.id, { ...this.editingRow, ...value } as Customer) : this.service.createCustomer(value);
    request.subscribe({ next: () => { this.showForm = false; this.toast.success(this.editingRow ? 'Client updated.' : 'Client created.'); this.loadData(); }, error: () => this.toast.error('Failed to save the client.') });
  }
  onDelete(row: Customer) { if (!confirm(`Delete client ${row.name}?`)) return; this.service.deleteCustomer(row.id).subscribe({ next: () => { this.toast.success('Client deleted.'); this.loadData(); }, error: () => this.toast.error('Failed to delete the client.') }); }
}
