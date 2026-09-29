import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { DataTable, TableColumn } from '../../../../shared/ui/data-table/data-table';
import { EntityFormModal } from '../../../../shared/ui/entity-form-modal/entity-form-modal';
import { EntityFormField } from '../../../../shared/ui/entity-form-modal/entity-form-field';
import { Lead } from '../../data/leads.mock';
import { CrmService } from '../../services/crm.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { Router } from '@angular/router';
import { CrmExportService } from '../../services/crm-export.service';

@Component({
  selector: 'app-lead-list',
  standalone: true,
  imports: [CommonModule, PageHeader, DataTable, EntityFormModal],
  template: `
    <app-page-header title="Leads" subtitle="Prospects & opportunities" createLabel="New Lead" (search)="onSearch($event)" (create)="openCreate()" />
    <div class="export-actions">
      <button type="button" title="Export visible leads to Excel" (click)="exportExcel()"><span class="material-symbols-outlined">table_view</span> Excel</button>
      <button type="button" title="Export visible leads to PDF" (click)="exportPdf()"><span class="material-symbols-outlined">picture_as_pdf</span> PDF</button>
    </div>
    @if (loading) {
      <p>Loading leads…</p>
    } @else if (error) {
      <p class="error">{{ error }}</p>
    } @else {
      <app-data-table [columns]="columns" [rows]="filteredRows" (rowClick)="openDetails($event)" (edit)="openEdit($event)" (delete)="onDelete($event)" />
    }
    @if (showForm) {
      <app-entity-form-modal
        [title]="editingRow ? 'Edit Lead' : 'New Lead'"
        [fields]="fields"
        [model]="editingRow"
        (save)="onSave($event)"
        (cancel)="showForm = false"
      />
    }
  `,
  styles: [`
    .error { color: #c0392b; }
    .export-actions { display: flex; justify-content: flex-end; gap: 8px; margin: -8px 0 14px; }
    .export-actions button { align-items: center; background: #fff; border: 1px solid #dedee5; border-radius: 5px; color: #464feb; cursor: pointer; display: inline-flex; font: inherit; font-size: 12px; gap: 5px; padding: 7px 10px; }
    .export-actions button:hover { background: #eef0fd; }
    .export-actions .material-symbols-outlined { font-size: 16px; }
  `],
})
export class LeadList implements OnInit {
  private crmService = inject(CrmService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private exportService = inject(CrmExportService);

  columns: TableColumn[] = [
    { key: 'name', label: 'Lead', type: 'link' },
    { key: 'company', label: 'Company' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'jobTitle', label: 'Role / Job Title' },
    { key: 'source', label: 'Source' },
    { key: 'expectedRevenue', label: 'Expected Revenue', type: 'currency' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'actions', label: '', type: 'actions' },
  ];

  fields: EntityFormField[] = [
    { key: 'name', label: 'Lead Name', type: 'text', required: true },
    { key: 'company', label: 'Company', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'phone', label: 'Phone', type: 'text', required: true },
    { key: 'jobTitle', label: 'Role / Job Title', type: 'text' },
    { key: 'website', label: 'Website', type: 'text' },
    { key: 'address', label: 'Address', type: 'text' },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'country', label: 'Country', type: 'text' },
    { key: 'source', label: 'Source', type: 'text', required: true },
    { key: 'expectedRevenue', label: 'Expected Revenue', type: 'number', required: true },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'New', label: 'New' },
        { value: 'Qualified', label: 'Qualified' },
        { value: 'Won', label: 'Won' },
        { value: 'Lost', label: 'Lost' },
      ],
    },
    { key: 'notes', label: 'Lead Notes', type: 'text' },
  ];

  allRows: Lead[] = [];
  filteredRows: Lead[] = [];
  loading = true;
  error = '';
  showForm = false;
  editingRow: Lead | null = null;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.crmService.getAll().subscribe({
      next: (data) => {
        this.allRows = data;
        this.filteredRows = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load leads. Is the CRM API running?';
        this.loading = false;
      },
    });
  }

  onSearch(term: string) {
    const t = term.toLowerCase();
    this.filteredRows = this.allRows.filter((l) =>
      `${l.name} ${l.company} ${l.email} ${l.phone} ${l.jobTitle}`.toLowerCase().includes(t),
    );
  }

  openCreate() {
    this.editingRow = null;
    this.showForm = true;
  }

  openEdit(row: Lead) {
    this.editingRow = row;
    this.showForm = true;
  }

  openDetails(row: Lead) {
    this.router.navigate(['/crm/leads', row.id]);
  }

  onSave(value: Record<string, unknown>) {
    if (this.editingRow) {
      const updated = { ...this.editingRow, ...value } as Lead;
      this.crmService.update(this.editingRow.id, updated).subscribe(() => {
        this.showForm = false;
        this.toast.success('Lead updated successfully.');
        this.loadData();
      }, () => this.toast.error('Failed to update the lead.'));
    } else {
      this.crmService.create(value).subscribe(() => {
        this.showForm = false;
        this.toast.success('Lead created successfully.');
        this.loadData();
      }, () => this.toast.error('Failed to create the lead.'));
    }
  }

  onDelete(row: Lead) {
    if (!confirm(`Delete lead ${row.name}?`)) return;
    this.crmService.delete(row.id).subscribe(() => {
      this.toast.success('Lead deleted successfully.');
      this.loadData();
    }, () => this.toast.error('Failed to delete the lead.'));
  }

  exportExcel() { this.exportService.exportLeadsExcel(this.filteredRows); }
  exportPdf() { this.exportService.exportLeadsPdf(this.filteredRows); }
}
