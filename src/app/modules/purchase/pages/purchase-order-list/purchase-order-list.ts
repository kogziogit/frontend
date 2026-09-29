import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { DataTable, TableColumn } from '../../../../shared/ui/data-table/data-table';
import { EntityFormModal } from '../../../../shared/ui/entity-form-modal/entity-form-modal';
import { EntityFormField } from '../../../../shared/ui/entity-form-modal/entity-form-field';
import { PurchaseOrder } from '../../data/purchase-orders.mock';
import { PurchaseService } from '../../services/purchase.service';

@Component({
  selector: 'app-purchase-order-list',
  standalone: true,
  imports: [CommonModule, PageHeader, DataTable, EntityFormModal],
  template: `
    <app-page-header title="Purchase Orders" subtitle="Orders sent to vendors" createLabel="New PO" (search)="onSearch($event)" (create)="openCreate()" />
    @if (loading) {
      <p>Loading purchase orders…</p>
    } @else if (error) {
      <p class="error">{{ error }}</p>
    } @else {
      <app-data-table [columns]="columns" [rows]="filteredRows" (edit)="openEdit($event)" (delete)="onDelete($event)" />
    }
    @if (showForm) {
      <app-entity-form-modal
        [title]="editingRow ? 'Edit Purchase Order' : 'New Purchase Order'"
        [fields]="fields"
        [model]="editingRow"
        (save)="onSave($event)"
        (cancel)="showForm = false"
      />
    }
  `,
  styles: [`.error { color: #c0392b; }`],
})
export class PurchaseOrderList implements OnInit {
  private purchaseService = inject(PurchaseService);

  columns: TableColumn[] = [
    { key: 'poNo', label: 'PO No', type: 'link' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'orderDate', label: 'Order Date' },
    { key: 'total', label: 'Total', type: 'currency' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'actions', label: '', type: 'actions' },
  ];

  fields: EntityFormField[] = [
    { key: 'poNo', label: 'PO No', type: 'text', required: true },
    { key: 'vendor', label: 'Vendor', type: 'text', required: true },
    { key: 'orderDate', label: 'Order Date', type: 'date', required: true },
    { key: 'total', label: 'Total', type: 'number', required: true },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'Draft', label: 'Draft' },
        { value: 'To Approve', label: 'To Approve' },
        { value: 'Confirmed', label: 'Confirmed' },
        { value: 'Cancelled', label: 'Cancelled' },
      ],
    },
  ];

  allRows: PurchaseOrder[] = [];
  filteredRows: PurchaseOrder[] = [];
  loading = true;
  error = '';
  showForm = false;
  editingRow: PurchaseOrder | null = null;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.purchaseService.getAll().subscribe({
      next: (data) => {
        this.allRows = data;
        this.filteredRows = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load purchase orders. Is the Purchase API running?';
        this.loading = false;
      },
    });
  }

  onSearch(term: string) {
    const t = term.toLowerCase();
    this.filteredRows = this.allRows.filter((o) => o.vendor.toLowerCase().includes(t) || o.poNo.toLowerCase().includes(t));
  }

  openCreate() {
    this.editingRow = null;
    this.showForm = true;
  }

  openEdit(row: PurchaseOrder) {
    this.editingRow = row;
    this.showForm = true;
  }

  onSave(value: Record<string, unknown>) {
    if (this.editingRow) {
      const updated = { ...this.editingRow, ...value } as PurchaseOrder;
      this.purchaseService.update(this.editingRow.id, updated).subscribe(() => {
        this.showForm = false;
        this.loadData();
      });
    } else {
      this.purchaseService.create(value).subscribe(() => {
        this.showForm = false;
        this.loadData();
      });
    }
  }

  onDelete(row: PurchaseOrder) {
    if (!confirm(`Delete purchase order ${row.poNo}?`)) return;
    this.purchaseService.delete(row.id).subscribe(() => this.loadData());
  }
}
