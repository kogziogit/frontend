import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { DataTable, TableColumn } from '../../../../shared/ui/data-table/data-table';
import { EntityFormModal } from '../../../../shared/ui/entity-form-modal/entity-form-modal';
import { EntityFormField } from '../../../../shared/ui/entity-form-modal/entity-form-field';
import { ChartOfAccount } from '../../data/ledger.mock';
import { LedgerService } from '../../services/ledger.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-chart-of-accounts',
  standalone: true,
  imports: [CommonModule, PageHeader, DataTable, EntityFormModal],
  template: `
    <app-page-header title="Chart of Accounts" subtitle="Accounts used across the General Ledger" createLabel="New Account" (search)="onSearch($event)" (create)="openCreate()" />
    @if (loading) {
      <p>Loading accounts…</p>
    } @else if (error) {
      <p class="error">{{ error }}</p>
    } @else {
      <app-data-table [columns]="columns" [rows]="filteredRows" (edit)="openEdit($event)" />
    }
    @if (showForm) {
      <app-entity-form-modal
        [title]="editingRow ? 'Edit Account' : 'New Account'"
        [fields]="fields"
        [model]="editingRow"
        (save)="onSave($event)"
        (cancel)="showForm = false"
      />
    }
  `,
  styles: [`.error { color: #c0392b; }`],
})
export class ChartOfAccounts implements OnInit {
  private ledgerService = inject(LedgerService);
  private toast = inject(ToastService);

  columns: TableColumn[] = [
    { key: 'code', label: 'Code', type: 'link' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', type: 'badge' },
    { key: 'isActive', label: 'Active' },
    { key: 'actions', label: '', type: 'actions' },
  ];

  fields: EntityFormField[] = [
    { key: 'code', label: 'Code', type: 'text', required: true },
    { key: 'name', label: 'Name', type: 'text', required: true },
    {
      key: 'type', label: 'Type', type: 'select', required: true,
      options: [
        { value: 'Asset', label: 'Asset' },
        { value: 'Liability', label: 'Liability' },
        { value: 'Equity', label: 'Equity' },
        { value: 'Income', label: 'Income' },
        { value: 'Expense', label: 'Expense' },
      ],
    },
  ];

  allRows: ChartOfAccount[] = [];
  filteredRows: ChartOfAccount[] = [];
  loading = true;
  error = '';
  showForm = false;
  editingRow: ChartOfAccount | null = null;

  ngOnInit() { this.loadData(); }

  loadData() {
    this.loading = true;
    this.ledgerService.getAccounts().subscribe({
      next: (data) => { this.allRows = data; this.filteredRows = data; this.loading = false; },
      error: () => { this.error = 'Failed to load the chart of accounts.'; this.loading = false; },
    });
  }

  onSearch(term: string) {
    const t = term.toLowerCase();
    this.filteredRows = this.allRows.filter((a) => `${a.code} ${a.name} ${a.type}`.toLowerCase().includes(t));
  }

  openCreate() { this.editingRow = null; this.showForm = true; }
  openEdit(row: ChartOfAccount) { this.editingRow = row; this.showForm = true; }

  onSave(value: Record<string, unknown>) {
    const account = { ...value, isActive: true };
    if (this.editingRow) {
      const updated = { ...this.editingRow, ...account } as ChartOfAccount;
      this.ledgerService.updateAccount(this.editingRow.id, updated).subscribe({
        next: () => { this.showForm = false; this.toast.success('Account updated.'); this.loadData(); },
        error: () => this.toast.error('Failed to update the account.'),
      });
    } else {
      this.ledgerService.createAccount(account).subscribe({
        next: () => { this.showForm = false; this.toast.success('Account created.'); this.loadData(); },
        error: () => this.toast.error('Failed to create the account.'),
      });
    }
  }
}
