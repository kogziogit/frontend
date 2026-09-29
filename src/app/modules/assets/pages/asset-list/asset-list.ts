import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { DataTable, TableColumn } from '../../../../shared/ui/data-table/data-table';
import { EntityFormModal } from '../../../../shared/ui/entity-form-modal/entity-form-modal';
import { EntityFormField } from '../../../../shared/ui/entity-form-modal/entity-form-field';
import { Asset } from '../../data/assets.mock';
import { AssetsService } from '../../services/assets.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-asset-list',
  standalone: true,
  imports: [CommonModule, PageHeader, DataTable, EntityFormModal],
  template: `
    <app-page-header title="Assets" subtitle="Laptops, printers & company equipment" createLabel="New Asset" (search)="onSearch($event)" (create)="openCreate()" />
    @if (loading) {
      <p>Loading assets…</p>
    } @else if (error) {
      <p class="error">{{ error }}</p>
    } @else {
      <app-data-table [columns]="columns" [rows]="filteredRows" (edit)="openEdit($event)" (delete)="onDelete($event)" />
    }
    @if (showForm) {
      <app-entity-form-modal
        [title]="editingRow ? 'Edit Asset' : 'New Asset'"
        [fields]="fields"
        [model]="editingRow"
        (save)="onSave($event)"
        (cancel)="showForm = false"
      />
    }
  `,
  styles: [`.error { color: #c0392b; }`],
})
export class AssetList implements OnInit {
  private assetsService = inject(AssetsService);
  private toast = inject(ToastService);

  columns: TableColumn[] = [
    { key: 'assetTag', label: 'Asset Tag', type: 'link' },
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category', type: 'badge' },
    { key: 'assignedTo', label: 'Assigned To' },
    { key: 'department', label: 'Department' },
    { key: 'location', label: 'Location' },
    { key: 'purchaseCost', label: 'Purchase Cost', type: 'currency' },
    { key: 'currentValue', label: 'Current Value', type: 'currency' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'actions', label: '', type: 'actions' },
  ];

  fields: EntityFormField[] = [
    { key: 'assetTag', label: 'Asset Tag', type: 'text', required: true },
    { key: 'name', label: 'Name', type: 'text', required: true },
    {
      key: 'category', label: 'Category', type: 'select', required: true,
      options: [
        { value: 'Laptop', label: 'Laptop' },
        { value: 'Desktop', label: 'Desktop' },
        { value: 'Monitor', label: 'Monitor' },
        { value: 'Printer', label: 'Printer' },
        { value: 'Mobile', label: 'Mobile' },
        { value: 'Furniture', label: 'Furniture' },
        { value: 'Other', label: 'Other' },
      ],
    },
    { key: 'brand', label: 'Brand', type: 'text' },
    { key: 'model', label: 'Model', type: 'text' },
    { key: 'serialNumber', label: 'Serial Number', type: 'text' },
    { key: 'assignedTo', label: 'Assigned To (employee)', type: 'text' },
    { key: 'department', label: 'Department', type: 'text' },
    { key: 'purchaseDate', label: 'Purchase Date', type: 'date' },
    { key: 'purchaseCost', label: 'Purchase Cost', type: 'number' },
    { key: 'usefulLifeYears', label: 'Useful Life (years)', type: 'number' },
    { key: 'salvageValue', label: 'Salvage Value', type: 'number' },
    { key: 'warrantyExpiry', label: 'Warranty Expiry', type: 'date' },
    { key: 'location', label: 'Location', type: 'text' },
    {
      key: 'status', label: 'Status', type: 'select', required: true,
      options: [
        { value: 'Available', label: 'Available' },
        { value: 'Assigned', label: 'Assigned' },
        { value: 'Under Repair', label: 'Under Repair' },
        { value: 'Retired', label: 'Retired' },
        { value: 'Lost', label: 'Lost' },
      ],
    },
    { key: 'notes', label: 'Notes', type: 'text' },
  ];

  allRows: Asset[] = [];
  filteredRows: Asset[] = [];
  loading = true;
  error = '';
  showForm = false;
  editingRow: Asset | null = null;

  ngOnInit() { this.loadData(); }

  loadData() {
    this.loading = true;
    this.assetsService.getAll().subscribe({
      next: (data) => { this.allRows = data; this.filteredRows = data; this.loading = false; },
      error: () => { this.error = 'Failed to load assets. Is the Assets API running?'; this.loading = false; },
    });
  }

  onSearch(term: string) {
    const t = term.toLowerCase();
    this.filteredRows = this.allRows.filter((a) => `${a.assetTag} ${a.name} ${a.category} ${a.assignedTo ?? ''} ${a.department ?? ''}`.toLowerCase().includes(t));
  }

  openCreate() { this.editingRow = null; this.showForm = true; }
  openEdit(row: Asset) { this.editingRow = row; this.showForm = true; }

  onSave(value: Record<string, unknown>) {
    if (this.editingRow) {
      const updated = { ...this.editingRow, ...value } as Asset;
      this.assetsService.update(this.editingRow.id, updated).subscribe({
        next: () => { this.showForm = false; this.toast.success('Asset updated successfully.'); this.loadData(); },
        error: (error) => this.toast.error(error?.error?.message ?? 'Failed to update the asset.'),
      });
    } else {
      this.assetsService.create(value).subscribe({
        next: () => { this.showForm = false; this.toast.success('Asset created successfully.'); this.loadData(); },
        error: (error) => this.toast.error(error?.error?.message ?? 'Failed to create the asset.'),
      });
    }
  }

  onDelete(row: Asset) {
    if (!confirm(`Delete asset ${row.assetTag}?`)) return;
    this.assetsService.delete(row.id).subscribe({
      next: () => { this.toast.success('Asset deleted.'); this.loadData(); },
      error: () => this.toast.error('Failed to delete the asset.'),
    });
  }
}
