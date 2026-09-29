import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="forbidden">
      <span class="material-symbols-outlined">lock</span>
      <h1>Access denied</h1>
      <p>You don't have permission to open this page. Ask an administrator to grant you access.</p>
      @if (required) {
        <code>{{ required }}</code>
      }
      <a routerLink="/" class="btn btn--primary">Back to apps</a>
    </div>
  `,
  styles: [`
    .forbidden { align-items: center; display: flex; flex-direction: column; gap: 12px; padding: 80px 20px; text-align: center; }
    .forbidden .material-symbols-outlined { background: #fdecea; border-radius: 50%; color: #c0392b; font-size: 34px; padding: 16px; }
    h1 { font-size: 20px; margin: 0; }
    p { color: #6b6b76; font-size: 13px; margin: 0; max-width: 420px; }
    code { background: #f2f2f6; border-radius: 5px; color: #6b6b76; font-size: 11px; padding: 4px 8px; }
    .btn { border-radius: 6px; font-size: 13px; margin-top: 8px; padding: 9px 16px; text-decoration: none; }
    .btn--primary { background: #464feb; color: #fff; }
  `],
})
export class Forbidden {
  readonly required = inject(ActivatedRoute).snapshot.queryParamMap.get('required') ?? '';
}
