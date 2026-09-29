import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Observable } from 'rxjs';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { DataTable, TableColumn } from '../../../../shared/ui/data-table/data-table';
import { EntityFormModal } from '../../../../shared/ui/entity-form-modal/entity-form-modal';
import { EntityFormField } from '../../../../shared/ui/entity-form-modal/entity-form-field';
import { Activity, CrmService } from '../../services/crm.service';
import { Lead } from '../../data/leads.mock';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { CrmExportService } from '../../services/crm-export.service';

interface ActivityRow extends Activity {
  leadName: string;
  company: string;
}

@Component({
  selector: 'app-activity-list',
  standalone: true,
  imports: [CommonModule, PageHeader, DataTable, EntityFormModal],
  template: `
    <app-page-header
      title="Follow-ups"
      subtitle="Track calls, meetings, emails, and the next action for every lead"
      createLabel="Log Activity"
      (search)="onSearch($event)"
      (create)="openCreate()"
    />
    <div class="export-actions">
      <button type="button" title="Export visible follow-ups to Excel" (click)="exportExcel()"><span class="material-symbols-outlined">table_view</span> Excel</button>
      <button type="button" title="Export visible follow-ups to PDF" (click)="exportPdf()"><span class="material-symbols-outlined">picture_as_pdf</span> PDF</button>
    </div>
    @if (loading) {
      <p>Loading follow-ups...</p>
    } @else if (error) {
      <p class="error">{{ error }}</p>
    } @else {
      <app-data-table [columns]="columns" [rows]="filteredRows" (edit)="openEdit($event)" (delete)="onDelete($event)" />
    }
    @if (showForm) {
      <app-entity-form-modal
        [title]="editingRow ? 'Edit Activity' : 'Log Follow-up'"
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
export class ActivityList implements OnInit {
  private crmService = inject(CrmService);
  private toast = inject(ToastService);
  private exportService = inject(CrmExportService);

  columns: TableColumn[] = [
    { key: 'type', label: 'Type', type: 'badge' },
    { key: 'subject', label: 'Subject', type: 'link' },
    { key: 'leadName', label: 'Lead' },
    { key: 'dueDate', label: 'Due', type: 'date' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'actions', label: '', type: 'actions' },
  ];

  fields: EntityFormField[] = [
    { key: 'leadId', label: 'Lead', type: 'select', required: true },
    {
      key: 'type', label: 'Activity Type', type: 'select', required: true,
      options: [
        { value: 'Call', label: 'Call' },
        { value: 'Email', label: 'Email' },
        { value: 'Meeting', label: 'Meeting' },
        { value: 'Note', label: 'Note' },
      ],
    },
    { key: 'subject', label: 'Subject / Next Action', type: 'text', required: true },
    { key: 'notes', label: 'Discussion Notes', type: 'text', required: true },
    { key: 'dueDate', label: 'Follow-up Date', type: 'date', required: true },
    {
      key: 'status', label: 'Status', type: 'select', required: true,
      options: [
        { value: 'Planned', label: 'Planned' },
        { value: 'Completed', label: 'Completed' },
        { value: 'Cancelled', label: 'Cancelled' },
      ],
    },
  ];

  allRows: ActivityRow[] = [];
  filteredRows: ActivityRow[] = [];
  loading = true;
  error = '';
  showForm = false;
  editingRow: ActivityRow | null = null;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    forkJoin({ activities: this.crmService.getActivities(), leads: this.crmService.getAll() }).subscribe({
      next: ({ activities, leads }) => {
        const leadMap = new Map(leads.map((lead) => [lead.id, lead]));
        this.allRows = activities.map((activity) => this.toRow(activity, leadMap.get(activity.leadId)));
        this.filteredRows = this.allRows;
        this.setLeadOptions(leads);
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load follow-ups. Is the CRM API running and the activities table created?';
        this.loading = false;
      },
    });
  }

  onSearch(term: string) {
    const query = term.toLowerCase();
    this.filteredRows = this.allRows.filter((row) =>
      `${row.subject} ${row.notes} ${row.leadName} ${row.company}`.toLowerCase().includes(query),
    );
  }

  openCreate() {
    this.editingRow = null;
    this.showForm = true;
  }

  openEdit(row: ActivityRow) {
    this.editingRow = row;
    this.showForm = true;
  }

  onSave(value: Record<string, unknown>) {
    const activity = { ...value, leadId: Number(value['leadId']) } as Partial<Activity>;
    const request: Observable<unknown> = this.editingRow
      ? this.crmService.updateActivity(this.editingRow.id, { ...this.editingRow, ...activity })
      : this.crmService.createActivity(activity);
    request.subscribe({
      next: () => {
        this.showForm = false;
        this.toast.success(this.editingRow ? 'Follow-up updated successfully.' : 'Follow-up saved successfully.');
        this.loadData();
      },
      error: () => { this.error = 'Failed to save the follow-up. Check the CRM API and database schema.'; this.toast.error(this.error); },
    });
  }

  onDelete(row: ActivityRow) {
    if (!confirm(`Delete follow-up "${row.subject}"?`)) return;
    this.crmService.deleteActivity(row.id).subscribe({
      next: () => { this.toast.success('Follow-up deleted successfully.'); this.loadData(); },
      error: () => { this.error = 'Failed to delete the follow-up.'; this.toast.error(this.error); },
    });
  }

  exportExcel() { this.exportService.exportActivitiesExcel(this.filteredRows); }
  exportPdf() { this.exportService.exportActivitiesPdf(this.filteredRows); }

  private setLeadOptions(leads: Lead[]) {
    const leadField = this.fields.find((field) => field.key === 'leadId');
    if (leadField) leadField.options = leads.map((lead) => ({ value: String(lead.id), label: `${lead.name} - ${lead.company}` }));
  }

  private toRow(activity: Activity, lead?: Lead): ActivityRow {
    return { ...activity, leadName: lead?.name ?? `Lead #${activity.leadId}`, company: lead?.company ?? '' };
  }
}
