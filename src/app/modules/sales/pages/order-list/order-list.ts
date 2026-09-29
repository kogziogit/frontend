import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { DataTable, TableColumn } from '../../../../shared/ui/data-table/data-table';
import { EntityFormModal } from '../../../../shared/ui/entity-form-modal/entity-form-modal';
import { EntityFormField } from '../../../../shared/ui/entity-form-modal/entity-form-field';
import { SalesOrder } from '../../data/orders.mock';
import { SalesService } from '../../services/sales.service';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, PageHeader, DataTable, EntityFormModal],
  template: `
    <app-page-header title="Orders" subtitle="Quotations & sales orders" createLabel="New Order" (search)="onSearch($event)" (create)="openCreate()" />
    @if (loading) {
      <p>Loading orders…</p>
    } @else if (error) {
      <p class="error">{{ error }}</p>
    } @else {
      <app-data-table [columns]="columns" [rows]="filteredRows" (edit)="openEdit($event)" (delete)="onDelete($event)" />
    }
    @if (showForm) {
      <app-entity-form-modal
        [title]="editingRow ? 'Edit Order' : 'New Order'"
        [fields]="fields"
        [model]="editingRow"
        (save)="onSave($event)"
        (cancel)="showForm = false"
      />
    }
  `,
  styles: [`.error { color: #c0392b; }`],
})
export class OrderList implements OnInit {
  private salesService = inject(SalesService);

  columns: TableColumn[] = [
    { key: 'orderNo', label: 'Order No', type: 'link' },
    { key: 'customer', label: 'Customer' },
    { key: 'orderDate', label: 'Order Date' },
    { key: 'total', label: 'Total', type: 'currency' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'actions', label: '', type: 'actions' },
  ];

  fields: EntityFormField[] = [
    { key: 'orderNo', label: 'Order No', type: 'text', required: true },
    { key: 'customer', label: 'Customer', type: 'text', required: true },
    { key: 'orderDate', label: 'Order Date', type: 'date', required: true },
    { key: 'total', label: 'Total', type: 'number', required: true },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'Draft', label: 'Draft' },
        { value: 'Confirmed', label: 'Confirmed' },
        { value: 'Done', label: 'Done' },
        { value: 'Cancelled', label: 'Cancelled' },
      ],
    },
  ];

  allRows: SalesOrder[] = [];
  filteredRows: SalesOrder[] = [];
  loading = true;
  error = '';
  showForm = false;
  editingRow: SalesOrder | null = null;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.salesService.getAll().subscribe({
      next: (data) => {
        this.allRows = data;
        this.filteredRows = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load orders. Is the Sales API running?';
        this.loading = false;
      },
    });
  }

  onSearch(term: string) {
    const t = term.toLowerCase();
    this.filteredRows = this.allRows.filter((o) => o.customer.toLowerCase().includes(t) || o.orderNo.toLowerCase().includes(t));
  }

  openCreate() {
    this.editingRow = null;
    this.showForm = true;
  }

  openEdit(row: SalesOrder) {
    this.editingRow = row;
    this.showForm = true;
  }

  onSave(value: Record<string, unknown>) {
    if (this.editingRow) {
      const updated = { ...this.editingRow, ...value } as SalesOrder;
      this.salesService.update(this.editingRow.id, updated).subscribe(() => {
        this.showForm = false;
        this.loadData();
      });
    } else {
      this.salesService.create(value).subscribe(() => {
        this.showForm = false;
        this.loadData();
      });
    }
  }

  onDelete(row: SalesOrder) {
    if (!confirm(`Delete order ${row.orderNo}?`)) return;
    this.salesService.delete(row.id).subscribe(() => this.loadData());
  }
}
