import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { DataTable, TableColumn } from '../../../../shared/ui/data-table/data-table';
import { EntityFormModal } from '../../../../shared/ui/entity-form-modal/entity-form-modal';
import { EntityFormField } from '../../../../shared/ui/entity-form-modal/entity-form-field';
import { HrmsService, JobOpening, Candidate } from '../../services/hrms.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

interface CandidateRow extends Candidate {
  jobTitle: string;
}

@Component({
  selector: 'app-recruitment',
  standalone: true,
  imports: [CommonModule, DataTable, EntityFormModal],
  template: `
    <section class="panel">
      <div class="panel-header"><h2>Job Openings</h2><button class="btn" type="button" (click)="openCreateJob()">New Job Opening</button></div>
      <app-data-table [columns]="jobColumns" [rows]="jobOpenings" (edit)="openEditJob($event)" (delete)="onDeleteJob($event)" />
    </section>

    <section class="panel">
      <div class="panel-header"><h2>Candidates</h2><button class="btn" type="button" (click)="openCreateCandidate()">New Candidate</button></div>
      <app-data-table [columns]="candidateColumns" [rows]="candidateRows" (edit)="openEditCandidate($event)" (delete)="onDeleteCandidate($event)" />
    </section>

    @if (showJobForm) {
      <app-entity-form-modal
        [title]="editingJob ? 'Edit Job Opening' : 'New Job Opening'"
        [fields]="jobFields"
        [model]="editingJob"
        (save)="onSaveJob($event)"
        (cancel)="showJobForm = false"
      />
    }
    @if (showCandidateForm) {
      <app-entity-form-modal
        [title]="editingCandidate ? 'Edit Candidate' : 'New Candidate'"
        [fields]="candidateFields"
        [model]="editingCandidate"
        (save)="onSaveCandidate($event)"
        (cancel)="showCandidateForm = false"
      />
    }
  `,
  styles: [`
    .panel { background: #fff; border: 1px solid #e2e2e8; border-radius: 8px; margin-bottom: 16px; padding: 18px; }
    .panel-header { align-items: center; display: flex; justify-content: space-between; margin-bottom: 12px; }
    .panel-header h2 { color: #292934; font-size: 16px; margin: 0; }
    .btn { background: #464feb; border: 0; border-radius: 6px; color: #fff; cursor: pointer; font: inherit; font-size: 12px; padding: 8px 12px; }
  `],
})
export class Recruitment implements OnInit {
  private hrmsService = inject(HrmsService);
  private toast = inject(ToastService);

  jobColumns: TableColumn[] = [
    { key: 'title', label: 'Title', type: 'link' },
    { key: 'department', label: 'Department' },
    { key: 'positionsCount', label: 'Positions' },
    { key: 'openedDate', label: 'Opened', type: 'date' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'actions', label: '', type: 'actions' },
  ];
  jobFields: EntityFormField[] = [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'department', label: 'Department', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'positionsCount', label: 'Positions', type: 'number', required: true },
    { key: 'openedDate', label: 'Opened Date', type: 'date', required: true },
    { key: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'Open', label: 'Open' }, { value: 'On Hold', label: 'On Hold' }, { value: 'Closed', label: 'Closed' }] },
  ];

  candidateColumns: TableColumn[] = [
    { key: 'name', label: 'Candidate', type: 'link' },
    { key: 'jobTitle', label: 'Applying For' },
    { key: 'email', label: 'Email' },
    { key: 'stage', label: 'Stage', type: 'badge' },
    { key: 'appliedDate', label: 'Applied', type: 'date' },
    { key: 'actions', label: '', type: 'actions' },
  ];
  candidateFields: EntityFormField[] = [
    { key: 'jobOpeningId', label: 'Job Opening', type: 'select', required: true, options: [] },
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'appliedDate', label: 'Applied Date', type: 'date', required: true },
    {
      key: 'stage', label: 'Stage', type: 'select', required: true,
      options: [
        { value: 'Applied', label: 'Applied' },
        { value: 'Screening', label: 'Screening' },
        { value: 'Interview', label: 'Interview' },
        { value: 'Offer', label: 'Offer' },
        { value: 'Hired', label: 'Hired' },
        { value: 'Rejected', label: 'Rejected' },
      ],
    },
    { key: 'notes', label: 'Notes', type: 'text' },
  ];

  jobOpenings: JobOpening[] = [];
  candidateRows: CandidateRow[] = [];
  showJobForm = false;
  showCandidateForm = false;
  editingJob: JobOpening | null = null;
  editingCandidate: CandidateRow | null = null;

  ngOnInit() { this.loadData(); }

  loadData() {
    this.hrmsService.getJobOpenings().subscribe((jobs) => {
      this.jobOpenings = jobs;
      const field = this.candidateFields.find((f) => f.key === 'jobOpeningId');
      if (field) field.options = jobs.map((j) => ({ value: String(j.id), label: j.title }));
      this.loadCandidates();
    });
  }

  loadCandidates() {
    this.hrmsService.getCandidates().subscribe((candidates) => {
      const jobMap = new Map(this.jobOpenings.map((j) => [j.id, j.title]));
      this.candidateRows = candidates.map((c) => ({ ...c, jobTitle: jobMap.get(c.jobOpeningId) ?? `Job #${c.jobOpeningId}` }));
    });
  }

  openCreateJob() { this.editingJob = null; this.showJobForm = true; }
  openEditJob(row: JobOpening) { this.editingJob = row; this.showJobForm = true; }
  onSaveJob(value: Record<string, unknown>) {
    const job = { ...value, positionsCount: Number(value['positionsCount']) };
    const request: Observable<unknown> = this.editingJob
      ? this.hrmsService.updateJobOpening(this.editingJob.id, { ...this.editingJob, ...job } as JobOpening)
      : this.hrmsService.createJobOpening(job);
    request.subscribe({
      next: () => { this.showJobForm = false; this.toast.success('Job opening saved.'); this.loadData(); },
      error: () => this.toast.error('Failed to save the job opening.'),
    });
  }
  onDeleteJob(row: JobOpening) {
    if (!confirm(`Delete job opening ${row.title}?`)) return;
    this.hrmsService.deleteJobOpening(row.id).subscribe({
      next: () => { this.toast.success('Job opening deleted.'); this.loadData(); },
      error: () => this.toast.error('Failed to delete the job opening.'),
    });
  }

  openCreateCandidate() { this.editingCandidate = null; this.showCandidateForm = true; }
  openEditCandidate(row: CandidateRow) { this.editingCandidate = row; this.showCandidateForm = true; }
  onSaveCandidate(value: Record<string, unknown>) {
    const candidate = { ...value, jobOpeningId: Number(value['jobOpeningId']) };
    const request: Observable<unknown> = this.editingCandidate
      ? this.hrmsService.updateCandidate(this.editingCandidate.id, { ...this.editingCandidate, ...candidate } as Candidate)
      : this.hrmsService.createCandidate(candidate);
    request.subscribe({
      next: () => { this.showCandidateForm = false; this.toast.success('Candidate saved.'); this.loadCandidates(); },
      error: () => this.toast.error('Failed to save the candidate.'),
    });
  }
  onDeleteCandidate(row: CandidateRow) {
    if (!confirm(`Delete candidate ${row.name}?`)) return;
    this.hrmsService.deleteCandidate(row.id).subscribe({
      next: () => { this.toast.success('Candidate deleted.'); this.loadCandidates(); },
      error: () => this.toast.error('Failed to delete the candidate.'),
    });
  }
}
