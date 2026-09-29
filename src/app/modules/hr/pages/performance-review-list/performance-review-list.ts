import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { DataTable, TableColumn } from '../../../../shared/ui/data-table/data-table';
import { EntityFormModal } from '../../../../shared/ui/entity-form-modal/entity-form-modal';
import { EntityFormField } from '../../../../shared/ui/entity-form-modal/entity-form-field';
import { Employee } from '../../data/employees.mock';
import { HrService } from '../../services/hr.service';
import { HrmsService, PerformanceReview } from '../../services/hrms.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

interface ReviewRow extends PerformanceReview {
  employeeName: string;
}

@Component({
  selector: 'app-performance-review-list',
  standalone: true,
  imports: [CommonModule, PageHeader, DataTable, EntityFormModal],
  template: `
    <app-page-header title="Performance Reviews" subtitle="Appraisal cycles & manager feedback" createLabel="New Review" (search)="onSearch($event)" (create)="openCreate()" />
    @if (loading) {
      <p>Loading reviews…</p>
    } @else {
      <app-data-table [columns]="columns" [rows]="filteredRows" (edit)="openEdit($event)" (delete)="onDelete($event)" />
    }
    @if (showForm) {
      <app-entity-form-modal
        [title]="editingRow ? 'Edit Review' : 'New Review'"
        [fields]="fields"
        [model]="editingRow"
        (save)="onSave($event)"
        (cancel)="showForm = false"
      />
    }
  `,
})
export class PerformanceReviewList implements OnInit {
  private hrmsService = inject(HrmsService);
  private hrService = inject(HrService);
  private toast = inject(ToastService);

  columns: TableColumn[] = [
    { key: 'employeeName', label: 'Employee', type: 'link' },
    { key: 'reviewPeriod', label: 'Period' },
    { key: 'reviewDate', label: 'Review Date', type: 'date' },
    { key: 'rating', label: 'Rating (1-5)' },
    { key: 'reviewerName', label: 'Reviewer' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'actions', label: '', type: 'actions' },
  ];

  fields: EntityFormField[] = [
    { key: 'employeeId', label: 'Employee', type: 'select', required: true, options: [] },
    { key: 'reviewPeriod', label: 'Review Period (e.g. 2026 H1)', type: 'text', required: true },
    { key: 'reviewDate', label: 'Review Date', type: 'date', required: true },
    { key: 'rating', label: 'Rating (1-5)', type: 'number', required: true },
    { key: 'reviewerName', label: 'Reviewer', type: 'text', required: true },
    { key: 'strengths', label: 'Strengths', type: 'text' },
    { key: 'areasForImprovement', label: 'Areas for Improvement', type: 'text' },
    { key: 'managerComments', label: 'Manager Comments', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'Draft', label: 'Draft' }, { value: 'Completed', label: 'Completed' }] },
  ];

  employees: Employee[] = [];
  allRows: ReviewRow[] = [];
  filteredRows: ReviewRow[] = [];
  loading = true;
  showForm = false;
  editingRow: ReviewRow | null = null;

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
    this.hrmsService.getPerformanceReviews().subscribe((data) => {
      const employeeMap = new Map(this.employees.map((e) => [e.id, e.name]));
      this.allRows = data.map((r) => ({ ...r, employeeName: employeeMap.get(r.employeeId) ?? `Employee #${r.employeeId}` }));
      this.filteredRows = this.allRows;
      this.loading = false;
    });
  }

  onSearch(term: string) {
    const t = term.toLowerCase();
    this.filteredRows = this.allRows.filter((r) => `${r.employeeName} ${r.reviewPeriod}`.toLowerCase().includes(t));
  }

  openCreate() { this.editingRow = null; this.showForm = true; }
  openEdit(row: ReviewRow) { this.editingRow = row; this.showForm = true; }

  onSave(value: Record<string, unknown>) {
    const review = { ...value, employeeId: Number(value['employeeId']), rating: Number(value['rating']) };
    const request: Observable<unknown> = this.editingRow
      ? this.hrmsService.updatePerformanceReview(this.editingRow.id, { ...this.editingRow, ...review } as PerformanceReview)
      : this.hrmsService.createPerformanceReview(review);
    request.subscribe({
      next: () => { this.showForm = false; this.toast.success('Review saved.'); this.loadData(); },
      error: () => this.toast.error('Failed to save the review.'),
    });
  }

  onDelete(row: ReviewRow) {
    if (!confirm(`Delete this review for ${row.employeeName}?`)) return;
    this.hrmsService.deletePerformanceReview(row.id).subscribe({
      next: () => { this.toast.success('Review deleted.'); this.loadData(); },
      error: () => this.toast.error('Failed to delete the review.'),
    });
  }
}
