import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Activity, CrmService } from '../../services/crm.service';
import { Lead } from '../../data/leads.mock';
import { EntityFormModal } from '../../../../shared/ui/entity-form-modal/entity-form-modal';
import { EntityFormField } from '../../../../shared/ui/entity-form-modal/entity-form-field';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-lead-detail',
  standalone: true,
  imports: [CommonModule, EntityFormModal],
  template: `
    @if (loading) {
      <p>Loading lead...</p>
    } @else if (error) {
      <p class="error">{{ error }}</p>
    } @else if (lead) {
      <button class="back-link" type="button" (click)="backToLeads()">
        <span class="material-symbols-outlined">arrow_back</span> Back to Leads
      </button>

      <header class="profile-header">
        <div>
          <span class="eyebrow">Lead profile</span>
          <h1>{{ lead.name }}</h1>
          <p>{{ lead.jobTitle || 'Contact' }} at {{ lead.company }}</p>
        </div>
        <span class="badge" [class]="'badge--' + lead.status.toLowerCase()">{{ lead.status }}</span>
      </header>

      <div class="detail-grid">
        <section class="panel contact-panel">
          <div class="panel-heading">
            <div>
              <h2>Contact details</h2>
              <p>Keep the account context close to every conversation.</p>
            </div>
          </div>
          <dl class="contact-list">
            <div><dt>Email</dt><dd><a [href]="'mailto:' + lead.email">{{ lead.email || 'Not provided' }}</a></dd></div>
            <div><dt>Phone</dt><dd><a [href]="'tel:' + lead.phone">{{ lead.phone || 'Not provided' }}</a></dd></div>
            <div><dt>Company</dt><dd>{{ lead.company }}</dd></div>
            <div><dt>Role / Job Title</dt><dd>{{ lead.jobTitle || 'Not provided' }}</dd></div>
            <div><dt>Location</dt><dd>{{ location }}</dd></div>
            <div><dt>Website</dt><dd>{{ lead.website || 'Not provided' }}</dd></div>
          </dl>
          @if (lead.notes) {
            <div class="notes"><strong>Lead notes</strong><p>{{ lead.notes }}</p></div>
          }
        </section>

        <section class="panel summary-panel">
          <div class="panel-heading"><h2>Deal summary</h2></div>
          <div class="summary-list">
            <div><span>Expected revenue</span><strong>{{ lead.expectedRevenue | currency: 'USD' : 'symbol' : '1.0-0' }}</strong></div>
            <div><span>Source</span><strong>{{ lead.source }}</strong></div>
            <div><span>Activities</span><strong>{{ activities.length }}</strong></div>
            <div><span>Next follow-up</span><strong>{{ nextActivity ? (nextActivity.dueDate | date: 'mediumDate') : 'None scheduled' }}</strong></div>
          </div>
        </section>
      </div>

      <section class="panel timeline-panel">
        <div class="panel-heading">
          <div><h2>Discussion and follow-up history</h2><p>Every call, meeting, email, and note stays connected to this lead.</p></div>
          <div class="timeline-actions">
            <button class="btn btn--secondary" type="button" (click)="showActivityForm = true"><span class="material-symbols-outlined">add</span> Log activity</button>
            <button class="btn btn--primary" type="button" (click)="openActivities()"><span class="material-symbols-outlined">event_note</span> Manage follow-ups</button>
          </div>
        </div>
        @if (activities.length) {
          <div class="timeline">
            @for (activity of activities; track activity.id) {
              <article class="timeline-item">
                <div class="timeline-marker"><span class="material-symbols-outlined">{{ iconFor(activity.type) }}</span></div>
                <div class="timeline-content">
                  <div class="timeline-meta"><span class="activity-type">{{ activity.type }}</span><span>{{ activity.dueDate | date: 'mediumDate' }}</span><span class="badge badge--{{ activity.status.toLowerCase() }}">{{ activity.status }}</span></div>
                  <h3>{{ activity.subject }}</h3>
                  <p>{{ activity.notes }}</p>
                </div>
              </article>
            }
          </div>
        } @else {
          <div class="empty-state"><span class="material-symbols-outlined">event_note</span><p>No discussion history yet.</p><button class="text-button" type="button" (click)="openActivities()">Log the first follow-up</button></div>
        }
      </section>

      @if (showActivityForm) {
        <app-entity-form-modal
          title="Log Follow-up"
          [fields]="activityFields"
          (save)="saveActivity($event)"
          (cancel)="showActivityForm = false"
        />
      }
    }
  `,
  styles: [`
    :host { display: block; }
    h1, h2, h3, p { margin: 0; }
    .back-link, .text-button { align-items: center; background: none; border: 0; color: #464feb; cursor: pointer; display: inline-flex; font: inherit; gap: 5px; padding: 0; }
    .back-link { font-size: 13px; margin-bottom: 18px; }
    .back-link .material-symbols-outlined { font-size: 17px; }
    .profile-header { align-items: center; display: flex; justify-content: space-between; margin-bottom: 24px; }
    .eyebrow { color: #777782; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
    h1 { color: #24242d; font-size: 28px; margin-top: 4px; }
    .profile-header p, .panel-heading p { color: #6b6b76; font-size: 13px; margin-top: 5px; }
    .badge { background: #eef0fd; border-radius: 12px; color: #464feb; display: inline-block; font-size: 11px; font-weight: 600; padding: 4px 10px; }
    .badge--won, .badge--completed { background: #e5f6ec; color: #1f8a4c; }
    .badge--lost, .badge--cancelled { background: #fde9e8; color: #c0392b; }
    .detail-grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(260px, .8fr); gap: 16px; margin-bottom: 16px; }
    .panel { background: #fff; border: 1px solid #e2e2e8; border-radius: 8px; padding: 20px; }
    .panel-heading { align-items: start; display: flex; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
    .timeline-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .panel-heading h2 { color: #292934; font-size: 17px; }
    .contact-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 24px; margin: 0; }
    .contact-list div { min-width: 0; }
    dt { color: #777782; font-size: 11px; margin-bottom: 4px; text-transform: uppercase; }
    dd { color: #292934; font-size: 14px; margin: 0; overflow-wrap: anywhere; }
    dd a { color: #464feb; text-decoration: none; }
    .notes { border-top: 1px solid #ececf0; margin-top: 20px; padding-top: 16px; }
    .notes strong { color: #777782; font-size: 11px; text-transform: uppercase; }
    .notes p { color: #41414d; font-size: 13px; line-height: 1.5; margin-top: 6px; }
    .summary-list { display: grid; gap: 17px; }
    .summary-list div { align-items: center; border-bottom: 1px solid #eeeeF2; display: flex; justify-content: space-between; gap: 16px; padding-bottom: 12px; }
    .summary-list div:last-child { border-bottom: 0; padding-bottom: 0; }
    .summary-list span { color: #777782; font-size: 13px; }
    .summary-list strong { color: #292934; font-size: 14px; text-align: right; }
    .timeline { display: grid; gap: 0; }
    .timeline-item { display: grid; grid-template-columns: 34px 1fr; gap: 12px; min-height: 92px; position: relative; }
    .timeline-item:not(:last-child)::before { background: #e1e1e7; content: ''; left: 16px; position: absolute; top: 32px; bottom: 0; width: 1px; }
    .timeline-marker { align-items: center; background: #eef0fd; border-radius: 50%; color: #464feb; display: flex; height: 32px; justify-content: center; position: relative; width: 32px; z-index: 1; }
    .timeline-marker .material-symbols-outlined { font-size: 17px; }
    .timeline-content { padding-bottom: 20px; }
    .timeline-meta { align-items: center; color: #777782; display: flex; flex-wrap: wrap; font-size: 12px; gap: 9px; }
    .activity-type { color: #464feb; font-weight: 600; }
    .timeline-content h3 { color: #292934; font-size: 14px; margin-top: 7px; }
    .timeline-content p { color: #555560; font-size: 13px; line-height: 1.5; margin-top: 5px; }
    .btn { align-items: center; border: 0; border-radius: 6px; cursor: pointer; display: inline-flex; font: inherit; font-size: 12px; gap: 6px; padding: 8px 12px; }
    .btn--primary { background: #464feb; color: #fff; }
    .btn--secondary { background: #eef0fd; color: #464feb; }
    .btn .material-symbols-outlined { font-size: 17px; }
    .empty-state { align-items: center; color: #777782; display: flex; flex-direction: column; gap: 8px; padding: 28px; text-align: center; }
    .empty-state .material-symbols-outlined { font-size: 28px; }
    .empty-state p { font-size: 13px; }
    .error { color: #c0392b; }
    @media (max-width: 800px) { .detail-grid { grid-template-columns: 1fr; } .profile-header { align-items: start; flex-direction: column; gap: 12px; } .contact-list { grid-template-columns: 1fr; } .panel-heading { flex-direction: column; } }
  `],
})
export class LeadDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private crmService = inject(CrmService);
  private toast = inject(ToastService);

  lead: Lead | null = null;
  activities: Activity[] = [];
  loading = true;
  error = '';
  showActivityForm = false;

  activityFields: EntityFormField[] = [
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

  get location() {
    if (!this.lead) return 'Not provided';
    return [this.lead.city, this.lead.country].filter(Boolean).join(', ') || 'Not provided';
  }

  get nextActivity() {
    return this.activities.find((activity) => activity.status === 'Planned');
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    forkJoin({ lead: this.crmService.getById(id), activities: this.crmService.getActivities(id) }).subscribe({
      next: ({ lead, activities }) => { this.lead = lead; this.activities = activities; this.loading = false; },
      error: () => { this.error = 'Failed to load this lead and its follow-up history.'; this.loading = false; },
    });
  }

  backToLeads() { this.router.navigate(['/crm/leads']); }
  openActivities() { this.router.navigate(['/crm/activities']); }
  iconFor(type: Activity['type']) { return type === 'Call' ? 'call' : type === 'Email' ? 'mail' : type === 'Meeting' ? 'calendar_month' : 'notes'; }

  saveActivity(value: Record<string, unknown>) {
    if (!this.lead) return;
    this.crmService.createActivity({ ...value, leadId: this.lead.id } as Partial<Activity>).subscribe({
      next: () => {
        this.showActivityForm = false;
        this.toast.success('Follow-up logged successfully.');
        this.loadActivities();
      },
      error: () => this.toast.error('Failed to log the follow-up.'),
    });
  }

  private loadActivities() {
    if (!this.lead) return;
    this.crmService.getActivities(this.lead.id).subscribe({
      next: (activities) => this.activities = activities,
      error: () => this.error = 'Failed to refresh the follow-up history.',
    });
  }
}
