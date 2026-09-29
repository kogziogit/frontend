import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiCard } from '../../../../shared/ui/kpi-card/kpi-card';
import { SalesOrder } from '../../data/orders.mock';
import { SalesService } from '../../services/sales.service';

@Component({
  selector: 'app-sales-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCard],
  template: `
    <div class="kpi-grid">
      <app-kpi-card label="Open Orders" [value]="openOrders" icon="shopping_bag" color="#00a09d" />
      <app-kpi-card label="Quotations" [value]="quotations" icon="request_quote" color="#464feb" />
      <app-kpi-card label="Revenue (Month)" [value]="'$' + (revenue | number: '1.0-0')" icon="trending_up" color="#1f8a4c" />
      <app-kpi-card label="Avg Order Value" [value]="'$' + (avgOrder | number: '1.0-0')" icon="analytics" color="#f0ad4e" />
    </div>
  `,
  styles: [`.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }`],
})
export class SalesDashboard implements OnInit {
  private salesService = inject(SalesService);

  orders: SalesOrder[] = [];
  openOrders = 0;
  quotations = 0;
  revenue = 0;
  avgOrder = 0;

  ngOnInit() {
    this.salesService.getAll().subscribe((orders) => {
      this.orders = orders;
      this.openOrders = orders.filter((o) => o.status === 'Confirmed').length;
      this.quotations = orders.filter((o) => o.status === 'Draft').length;
      this.revenue = orders.reduce((sum, o) => sum + o.total, 0);
      this.avgOrder = orders.length ? this.revenue / orders.length : 0;
    });
  }
}
