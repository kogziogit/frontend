import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiCard } from '../../../../shared/ui/kpi-card/kpi-card';
import { TimesheetService } from '../../services/timesheet.service';

@Component({
  selector: 'app-timesheet-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCard],
  template: `
    <div class="kpi-grid">
      <app-kpi-card label="Total Hours" [value]="totalHours" icon="schedule" color="#2c5f9e" />
      <app-kpi-card label="Billable Hours" [value]="billableHours" icon="payments" color="#1f8a4c" />
      <app-kpi-card label="Uninvoiced Amount" [value]="uninvoicedAmount" icon="receipt_long" color="#f0ad4e" />
      <app-kpi-card label="Entries" [value]="total" icon="checklist" color="#875a7b" />
    </div>
  `,
  styles: [`.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }`],
})
export class TimesheetDashboard implements OnInit {
  private timesheetService = inject(TimesheetService);

  total = 0;
  totalHours = 0;
  billableHours = 0;
  uninvoicedAmount = 0;

  ngOnInit() {
    this.timesheetService.getAll().subscribe((entries) => {
      this.total = entries.length;
      this.totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
      this.billableHours = entries.filter((e) => e.billable).reduce((sum, e) => sum + e.hours, 0);
      this.uninvoicedAmount = entries
        .filter((e) => e.billable && e.status !== 'Invoiced')
        .reduce((sum, e) => sum + (e.amount ?? e.hours * e.ratePerHour), 0);
    });
  }
}
