import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { DataTable, TableColumn } from '../../../../shared/ui/data-table/data-table';
import { EntityFormModal } from '../../../../shared/ui/entity-form-modal/entity-form-modal';
import { EntityFormField } from '../../../../shared/ui/entity-form-modal/entity-form-field';
import { HrmsService, Holiday } from '../../services/hrms.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-holiday-list',
  standalone: true,
  imports: [CommonModule, PageHeader, DataTable, EntityFormModal],
  template: `
    <app-page-header title="Holiday Calendar" subtitle="Company holidays for the year" createLabel="New Holiday" (search)="onSearch($event)" (create)="openCreate()" />
    <app-data-table [columns]="columns" [rows]="filteredRows" (edit)="openEdit($event)" (delete)="onDelete($event)" />
    @if (showForm) {
      <app-entity-form-modal
        [title]="editingRow ? 'Edit Holiday' : 'New Holiday'"
        [fields]="fields"
        [model]="editingRow"
        (save)="onSave($event)"
        (cancel)="showForm = false"
      />
    }
  `,
})
export class HolidayList implements OnInit {
  private hrmsService = inject(HrmsService);
  private toast = inject(ToastService);

  columns: TableColumn[] = [
    { key: 'name', label: 'Holiday', type: 'link' },
    { key: 'holidayDate', label: 'Date', type: 'date' },
    { key: 'type', label: 'Type', type: 'badge' },
    { key: 'description', label: 'Description' },
    { key: 'actions', label: '', type: 'actions' },
  ];

  fields: EntityFormField[] = [
    { key: 'name', label: 'Holiday Name', type: 'text', required: true },
    { key: 'holidayDate', label: 'Date', type: 'date', required: true },
    { key: 'type', label: 'Type', type: 'select', required: true, options: [{ value: 'Mandatory', label: 'Mandatory' }, { value: 'Optional', label: 'Optional' }] },
    { key: 'description', label: 'Description', type: 'text' },
  ];

  allRows: Holiday[] = [];
  filteredRows: Holiday[] = [];
  showForm = false;
  editingRow: Holiday | null = null;

  ngOnInit() { this.loadData(); }

  loadData() {
    this.hrmsService.getHolidays().subscribe((data) => { this.allRows = data; this.filteredRows = data; });
  }

  onSearch(term: string) {
    const t = term.toLowerCase();
    this.filteredRows = this.allRows.filter((h) => h.name.toLowerCase().includes(t));
  }

  openCreate() { this.editingRow = null; this.showForm = true; }
  openEdit(row: Holiday) { this.editingRow = row; this.showForm = true; }

  onSave(value: Record<string, unknown>) {
    const request: Observable<unknown> = this.editingRow
      ? this.hrmsService.updateHoliday(this.editingRow.id, { ...this.editingRow, ...value } as Holiday)
      : this.hrmsService.createHoliday(value);
    request.subscribe({
      next: () => { this.showForm = false; this.toast.success('Holiday saved.'); this.loadData(); },
      error: () => this.toast.error('Failed to save the holiday.'),
    });
  }

  onDelete(row: Holiday) {
    if (!confirm(`Delete holiday ${row.name}?`)) return;
    this.hrmsService.deleteHoliday(row.id).subscribe({
      next: () => { this.toast.success('Holiday deleted.'); this.loadData(); },
      error: () => this.toast.error('Failed to delete the holiday.'),
    });
  }
}
