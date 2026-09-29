import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiCard } from '../../../../shared/ui/kpi-card/kpi-card';
import { HrService } from '../../services/hr.service';

@Component({
  selector: 'app-hr-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCard],
  template: `
    <div class="kpi-grid">
      <app-kpi-card label="Total Employees" [value]="totalEmployees" icon="groups" color="#875a7b" />
      <app-kpi-card label="On Leave Today" [value]="1" icon="event_busy" color="#f0ad4e" />
      <app-kpi-card label="Open Positions" [value]="3" icon="work" color="#00a09d" />
      <app-kpi-card label="Active Staff" [value]="active" icon="how_to_reg" color="#1f8a4c" />
    </div>
  `,
  styles: [`.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }`],
})
export class HrDashboard implements OnInit {
  private hrService = inject(HrService);

  totalEmployees = 0;
  active = 0;

  ngOnInit() {
    this.hrService.getAll().subscribe((employees) => {
      this.totalEmployees = employees.length;
      this.active = employees.filter((e) => e.status === 'Active').length;
    });
  }
}
