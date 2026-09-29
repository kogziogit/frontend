import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiCard } from '../../../../shared/ui/kpi-card/kpi-card';
import { AccountingService } from '../../services/accounting.service';

@Component({
  selector: 'app-accounting-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCard],
  template: `
    <div class="kpi-grid">
      <app-kpi-card label="Outstanding Invoices" [value]="outstanding" icon="receipt_long" color="#2c5f9e" />
      <app-kpi-card label="Overdue Amount" [value]="'$' + (overdueAmount | number: '1.0-0')" icon="error" color="#c0392b" />
      <app-kpi-card label="Revenue (MTD)" [value]="'$' + (revenue | number: '1.0-0')" icon="trending_up" color="#1f8a4c" />
      <app-kpi-card label="Expenses (MTD)" [value]="'$4,120'" icon="account_balance_wallet" color="#f0ad4e" />
    </div>
  `,
  styles: [`.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }`],
})
export class AccountingDashboard implements OnInit {
  private accountingService = inject(AccountingService);

  outstanding = 0;
  overdueAmount = 0;
  revenue = 0;

  ngOnInit() {
    this.accountingService.getAll().subscribe((invoices) => {
      this.outstanding = invoices.filter((i) => i.status !== 'Paid').length;
      this.overdueAmount = invoices.filter((i) => i.status === 'Overdue').reduce((s, i) => s + i.amount, 0);
      this.revenue = invoices.reduce((s, i) => s + i.amount, 0);
    });
  }
}
