import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="coming-soon">
      <span class="material-symbols-outlined">construction</span>
      <h3>{{ title }}</h3>
      <p>This screen is planned for an upcoming iteration of the {{ moduleName }} micro-app.</p>
    </div>
  `,
  styles: [`
    .coming-soon {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 60px 20px;
      color: #6b6b76;
      background: #fff;
      border: 1px dashed #e6e6e6;
      border-radius: 8px;
    }
    .material-symbols-outlined { font-size: 36px; color: #9a9aa2; margin-bottom: 10px; }
    h3 { margin: 0 0 6px; color: #2b2b33; }
    p { margin: 0; font-size: 13px; max-width: 360px; }
  `],
})
export class ComingSoon {
  @Input() title = 'Coming soon';
  @Input() moduleName = 'this';
}
