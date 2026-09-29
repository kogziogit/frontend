import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      @for (message of toast.messages(); track message.id) {
        <div class="toast" [class.toast--error]="message.kind === 'error'" [class.toast--success]="message.kind === 'success'" role="status">
          <span class="material-symbols-outlined">{{ message.kind === 'success' ? 'check_circle' : 'error' }}</span>
          <span>{{ message.text }}</span>
          <button type="button" title="Dismiss" (click)="toast.dismiss(message.id)">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack { position: fixed; top: 18px; right: 18px; z-index: 100; display: grid; gap: 10px; width: min(360px, calc(100vw - 36px)); }
    .toast { align-items: center; border-radius: 7px; box-shadow: 0 8px 24px rgba(30, 30, 40, .18); color: #fff; display: flex; gap: 10px; padding: 12px 14px; font-size: 13px; }
    .toast--success { background: #1f8a4c; }
    .toast--error { background: #c0392b; }
    .toast button { background: transparent; border: 0; color: inherit; cursor: pointer; display: grid; margin-left: auto; padding: 0; }
    .toast .material-symbols-outlined { font-size: 19px; }
  `],
})
export class ToastHost {
  readonly toast = inject(ToastService);
}
