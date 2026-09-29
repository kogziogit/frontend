import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiCard } from '../../../../shared/ui/kpi-card/kpi-card';
import { PurchaseService } from '../../services/purchase.service';

@Component({
  selector: 'app-purchase-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCard],
  template: `
    <div class="kpi-grid">
      <app-kpi-card label="Open POs" [value]="openPOs" icon="local_shipping" color="#f0ad4e" />
      <app-kpi-card label="Pending Approval" [value]="pendingApproval" icon="fact_check" color="#b5760a" />
      <app-kpi-card label="Vendors" [value]="4" icon="storefront" color="#00a09d" />
      <app-kpi-card label="Spend (Month)" [value]="'$' + (spend | number: '1.0-0')" icon="payments" color="#464feb" />
    </div>
  `,
  styles: [`.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }`],
})
export class PurchaseDashboard implements OnInit {
  private purchaseService = inject(PurchaseService);

  openPOs = 0;
  pendingApproval = 0;
  spend = 0;

  ngOnInit() {
    this.purchaseService.getAll().subscribe((orders) => {
      this.openPOs = orders.filter((o) => o.status === 'Confirmed').length;
      this.pendingApproval = orders.filter((o) => o.status === 'To Approve').length;
      this.spend = orders.reduce((sum, o) => sum + o.total, 0);
    });
  }
}
