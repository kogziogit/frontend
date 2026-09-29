import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiCard } from '../../../../shared/ui/kpi-card/kpi-card';
import { CrmService } from '../../services/crm.service';

@Component({
  selector: 'app-crm-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCard],
  template: `
    <div class="kpi-grid">
      <app-kpi-card label="Total Leads" [value]="totalLeads" icon="groups" color="#d9534f" />
      <app-kpi-card label="Qualified" [value]="qualified" icon="verified" color="#464feb" />
      <app-kpi-card label="Won This Month" [value]="won" icon="emoji_events" color="#1f8a4c" />
      <app-kpi-card label="Pipeline Value" [value]="'$' + (pipelineValue | number: '1.0-0')" icon="payments" color="#f0ad4e" />
    </div>
  `,
  styles: [`.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }`],
})
export class CrmDashboard implements OnInit {
  private crmService = inject(CrmService);

  totalLeads = 0;
  qualified = 0;
  won = 0;
  pipelineValue = 0;

  ngOnInit() {
    this.crmService.getAll().subscribe((leads) => {
      this.totalLeads = leads.length;
      this.qualified = leads.filter((l) => l.status === 'Qualified').length;
      this.won = leads.filter((l) => l.status === 'Won').length;
      this.pipelineValue = leads.filter((l) => l.status !== 'Lost').reduce((s, l) => s + l.expectedRevenue, 0);
    });
  }
}
