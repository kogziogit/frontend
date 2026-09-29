import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Lead } from '../../data/leads.mock';
import { CrmService } from '../../services/crm.service';

type LeadStatus = Lead['status'];

@Component({
  selector: 'app-crm-pipeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="page-header">
      <div>
        <h1>Pipeline</h1>
        <p>Move opportunities through the sales stages.</p>
      </div>
      <div class="pipeline-summary">
        <span>{{ leads.length }} leads</span>
        <strong>{{ pipelineValue | currency: 'USD' : 'symbol' : '1.0-0' }}</strong>
      </div>
    </header>

    @if (loading) {
      <p>Loading pipeline...</p>
    } @else if (error) {
      <p class="error">{{ error }}</p>
    } @else {
      <div class="pipeline" aria-label="CRM pipeline">
        @for (stage of stages; track stage) {
          <section class="stage" [attr.aria-labelledby]="'stage-' + stage">
            <div class="stage-header">
              <div>
                <h2 [id]="'stage-' + stage">{{ stage }}</h2>
                <span>{{ leadsFor(stage).length }} leads</span>
              </div>
              <strong>{{ stageValue(stage) | currency: 'USD' : 'symbol' : '1.0-0' }}</strong>
            </div>

            <div class="stage-list">
              @for (lead of leadsFor(stage); track lead.id) {
                <article class="lead-card">
                  <div class="card-topline">
                    <span class="source">{{ lead.source }}</span>
                    <span class="revenue">{{ lead.expectedRevenue | currency: 'USD' : 'symbol' : '1.0-0' }}</span>
                  </div>
                  <h3>{{ lead.name }}</h3>
                  <p>{{ lead.company }}</p>
                  <label>
                    <span class="sr-only">Change stage for {{ lead.name }}</span>
                    <select (change)="changeStage(lead, $any($event.target).value)">
                      @for (option of stages; track option) {
                        <option [value]="option" [selected]="option === lead.status">{{ option }}</option>
                      }
                    </select>
                  </label>
                </article>
              } @empty {
                <p class="empty">No leads in this stage.</p>
              }
            </div>
          </section>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .page-header { align-items: end; display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
    h1, h2, h3, p { margin: 0; }
    h1 { color: #24242d; font-size: 28px; }
    .page-header p { color: #6b6b76; margin-top: 6px; }
    .pipeline-summary { align-items: end; display: flex; flex-direction: column; gap: 4px; }
    .pipeline-summary span, .stage-header span { color: #777782; font-size: 13px; }
    .pipeline-summary strong { color: #24242d; font-size: 20px; }
    .pipeline { display: grid; grid-template-columns: repeat(4, minmax(220px, 1fr)); gap: 14px; overflow-x: auto; }
    .stage { background: #f0f0f3; border: 1px solid #dedee4; border-radius: 8px; min-height: 360px; padding: 14px; }
    .stage-header { align-items: start; border-bottom: 1px solid #d8d8df; display: flex; justify-content: space-between; gap: 12px; padding-bottom: 12px; }
    .stage-header h2 { color: #292934; font-size: 16px; }
    .stage-header strong { color: #464feb; font-size: 14px; }
    .stage-list { display: grid; gap: 10px; padding-top: 12px; }
    .lead-card { background: #fff; border: 1px solid #e0e0e6; border-radius: 6px; box-shadow: 0 2px 8px rgba(37, 37, 48, .06); padding: 13px; }
    .card-topline { display: flex; justify-content: space-between; gap: 8px; }
    .source { color: #777782; font-size: 12px; }
    .revenue { color: #1f8a4c; font-size: 12px; font-weight: 700; }
    .lead-card h3 { color: #292934; font-size: 15px; margin-top: 11px; }
    .lead-card p { color: #6b6b76; font-size: 13px; margin-top: 4px; }
    select { background: #fafafd; border: 1px solid #d6d6df; border-radius: 4px; color: #41414d; font: inherit; margin-top: 14px; padding: 7px 8px; width: 100%; }
    .empty { color: #8a8a95; font-size: 13px; padding: 18px 4px; text-align: center; }
    .error { color: #c0392b; }
    .sr-only { height: 1px; margin: -1px; overflow: hidden; position: absolute; width: 1px; clip: rect(0, 0, 0, 0); }
    @media (max-width: 900px) { .page-header { align-items: start; flex-direction: column; } .pipeline { grid-template-columns: repeat(4, minmax(240px, 1fr)); } }
  `],
})
export class Pipeline implements OnInit {
  private crmService = inject(CrmService);

  readonly stages: LeadStatus[] = ['New', 'Qualified', 'Won', 'Lost'];
  leads: Lead[] = [];
  loading = true;
  error = '';

  get pipelineValue() {
    return this.leads.filter((lead) => lead.status !== 'Lost').reduce((total, lead) => total + lead.expectedRevenue, 0);
  }

  ngOnInit() {
    this.loadData();
  }

  leadsFor(stage: LeadStatus) {
    return this.leads.filter((lead) => lead.status === stage);
  }

  stageValue(stage: LeadStatus) {
    return this.leadsFor(stage).reduce((total, lead) => total + lead.expectedRevenue, 0);
  }

  changeStage(lead: Lead, status: string) {
    const nextStatus = status as LeadStatus;
    if (!this.stages.includes(nextStatus) || nextStatus === lead.status) return;

    const previousStatus = lead.status;
    lead.status = nextStatus;
    this.crmService.update(lead.id, lead).subscribe({
      error: () => {
        lead.status = previousStatus;
        this.error = 'Failed to update the lead stage. Is the CRM API running?';
      },
    });
  }

  private loadData() {
    this.loading = true;
    this.crmService.getAll().subscribe({
      next: (data) => {
        this.leads = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load the pipeline. Is the CRM API running?';
        this.loading = false;
      },
    });
  }
}
