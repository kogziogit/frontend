import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kpi-card">
      <div class="kpi-card__icon" [style.background]="color + '1a'" [style.color]="color">
        <span class="material-symbols-outlined">{{ icon }}</span>
      </div>
      <div class="kpi-card__body">
        <span class="kpi-card__value">{{ value }}</span>
        <span class="kpi-card__label">{{ label }}</span>
      </div>
    </div>
  `,
  styleUrl: './kpi-card.scss',
})
export class KpiCard {
  @Input() label = '';
  @Input() value: string | number = 0;
  @Input() icon = 'analytics';
  @Input() color = '#464feb';
}
