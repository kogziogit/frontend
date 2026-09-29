import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiCard } from '../../../../shared/ui/kpi-card/kpi-card';
import { AssetsService } from '../../services/assets.service';

@Component({
  selector: 'app-asset-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCard],
  template: `
    <div class="kpi-grid">
      <app-kpi-card label="Total Assets" [value]="total" icon="devices" color="#2c5f9e" />
      <app-kpi-card label="Assigned" [value]="assigned" icon="assignment_ind" color="#1f8a4c" />
      <app-kpi-card label="Available" [value]="available" icon="inventory_2" color="#00a09d" />
      <app-kpi-card label="Under Repair" [value]="underRepair" icon="build" color="#f0ad4e" />
      <app-kpi-card label="Current Book Value" [value]="totalValue" icon="payments" color="#875a7b" />
    </div>
  `,
  styles: [`.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }`],
})
export class AssetDashboard implements OnInit {
  private assetsService = inject(AssetsService);

  total = 0;
  assigned = 0;
  available = 0;
  underRepair = 0;
  totalValue = 0;

  ngOnInit() {
    this.assetsService.getAll().subscribe((assets) => {
      this.total = assets.length;
      this.assigned = assets.filter((a) => a.status === 'Assigned').length;
      this.available = assets.filter((a) => a.status === 'Available').length;
      this.underRepair = assets.filter((a) => a.status === 'Under Repair').length;
      this.totalValue = assets.reduce((sum, a) => sum + (a.currentValue ?? a.purchaseCost ?? 0), 0);
    });
  }
}
