import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { HasPermissionDirective } from '../../../../core/auth/has-permission.directive';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { CURRENCIES } from '../../../../shared/data/currencies';
import {
  AccountingCoreService, AccountJournal, AccountPayment, OutstandingLine,
} from '../../services/accounting-core.service';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeader, HasPermissionDirective],
  template: `
    <app-page-header
      title="Payments"
      subtitle="Receipts, disbursements and matching"
      createLabel="Register Payment"
      (search)="applyFilter($event)"
      (create)="openRegister()"
    />

    @if (loading) {
      <p>Loading payments…</p>
    } @else if (error) {
      <p class="error">{{ error }}</p>
    } @else {
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Number</th><th>Partner</th><th>Date</th><th>Journal</th><th>Method</th>
              <th class="num">Amount</th><th class="num">Unmatched</th><th>Direction</th><th></th>
            </tr>
          </thead>
          <tbody>
            @for (p of filtered; track p.id) {
              <tr>
                <td class="mono">{{ p.name }}</td>
                <td>{{ p.partnerName }}</td>
                <td>{{ p.paymentDate | date: 'mediumDate' }}</td>
                <td class="muted">{{ p.journalName }}</td>
                <td class="muted">{{ p.paymentMethod }}</td>
                <td class="num strong">{{ p.amount | number: '1.2-2' }} {{ p.currencyCode }}</td>
                <td class="num" [class.open]="p.amountUnreconciled > 0">{{ p.amountUnreconciled | number: '1.2-2' }}</td>
                <td>
                  <span class="badge" [class]="p.paymentType === 'inbound' ? 'badge--in' : 'badge--out'">
                    {{ p.paymentType === 'inbound' ? 'Received' : 'Sent' }}
                  </span>
                </td>
                <td class="actions">
                  @if (p.state === 'draft') {
                    <button type="button" class="icon-btn icon-btn--danger" title="Delete" *hasPermission="'accounting.payments.delete'" (click)="remove(p)">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="9" class="empty">No payments recorded yet.</td></tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (showRegister) {
      <div class="modal-backdrop" (click)="showRegister = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <header class="modal__header">
            <h2>Register Payment</h2>
            <button type="button" class="icon-btn" (click)="showRegister = false">
              <span class="material-symbols-outlined">close</span>
            </button>
          </header>

          <div class="modal__body">
            <div class="grid">
              <label>
                Direction
                <select [(ngModel)]="form.partnerType" (ngModelChange)="loadOutstanding()">
                  <option value="customer">Customer receipt</option>
                  <option value="supplier">Vendor payment</option>
                </select>
              </label>
              <label>
                Journal
                <select [(ngModel)]="form.journalId">
                  @for (j of bankJournals; track j.id) { <option [ngValue]="j.id">{{ j.name }}</option> }
                </select>
              </label>
              <label>Amount<input type="number" step="0.01" [(ngModel)]="form.amount" /></label>
              <label>Date<input type="date" [(ngModel)]="form.paymentDate" /></label>
              <label>Currency<select [(ngModel)]="form.currencyCode">
                @for (currency of currencies; track currency.code) { <option [ngValue]="currency.code">{{ currency.code }} — {{ currency.name }}</option> }
              </select></label>
              <label>Method<input type="text" [(ngModel)]="form.paymentMethod" /></label>
              <label>Reference<input type="text" [(ngModel)]="form.reference" /></label>
            </div>

            <h3>Settle against</h3>
            <p class="hint">Pick the documents this payment clears. Leave everything unticked to hold it as an unallocated advance.</p>

            <div class="outstanding">
              @for (line of outstanding; track line.moveLineId) {
                <label class="out-row" [class.selected]="selected.includes(line.moveId)">
                  <input type="checkbox" [checked]="selected.includes(line.moveId)" (change)="toggle(line)" />
                  <span class="mono">{{ line.moveName }}</span>
                  <span>{{ line.partnerName }}</span>
                  <span class="muted">due {{ line.dueDate | date: 'mediumDate' }}</span>
                  <span class="num strong">{{ line.amountResidual | number: '1.2-2' }} {{ line.currencyCode }}</span>
                </label>
              } @empty {
                <p class="empty">Nothing outstanding.</p>
              }
            </div>
          </div>

          <footer class="modal__footer">
            <span class="spacer"></span>
            <button type="button" class="btn" (click)="showRegister = false">Cancel</button>
            <button type="button" class="btn btn--primary" (click)="submit()">Post Payment</button>
          </footer>
        </div>
      </div>
    }
  `,
  styleUrl: './payment-list.scss',
})
export class PaymentList implements OnInit {
  currencies = CURRENCIES;
  private service = inject(AccountingCoreService);
  private toast = inject(ToastService);

  payments: AccountPayment[] = [];
  filtered: AccountPayment[] = [];
  journals: AccountJournal[] = [];
  outstanding: OutstandingLine[] = [];
  selected: number[] = [];

  loading = true;
  error = '';
  showRegister = false;

  form = this.emptyForm();

  ngOnInit() {
    forkJoin({ payments: this.service.getPayments(), journals: this.service.getJournals() }).subscribe({
      next: ({ payments, journals }) => {
        this.payments = payments;
        this.filtered = payments;
        this.journals = journals.filter((j) => j.isActive);
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load payments.';
        this.loading = false;
      },
    });
  }

  get bankJournals() {
    return this.journals.filter((j) => j.type === 'bank' || j.type === 'cash');
  }

  load() {
    this.service.getPayments().subscribe((payments) => {
      this.payments = payments;
      this.filtered = payments;
    });
  }

  applyFilter(term: string) {
    const t = term.toLowerCase();
    this.filtered = this.payments.filter((p) =>
      `${p.name} ${p.partnerName ?? ''} ${p.reference ?? ''}`.toLowerCase().includes(t)
    );
  }

  openRegister() {
    this.form = this.emptyForm();
    this.form.journalId = this.bankJournals[0]?.id ?? 0;
    this.selected = [];
    this.loadOutstanding();
    this.showRegister = true;
  }

  loadOutstanding() {
    this.service.getOutstanding(this.form.partnerType).subscribe((lines) => {
      this.outstanding = lines;
      this.selected = [];
    });
  }

  toggle(line: OutstandingLine) {
    this.selected = this.selected.includes(line.moveId)
      ? this.selected.filter((id) => id !== line.moveId)
      : [...this.selected, line.moveId];

    const chosen = this.outstanding.filter((l) => this.selected.includes(l.moveId));
    if (chosen.length) {
      this.form.amount = Math.round(chosen.reduce((s, l) => s + l.amountResidual, 0) * 100) / 100;
      this.form.partnerName = chosen[0].partnerName ?? '';
      this.form.partnerId = chosen[0].partnerId ?? null;
      this.form.currencyCode = chosen[0].currencyCode;
    }
  }

  submit() {
    if (this.form.amount <= 0) {
      this.toast.error('Enter an amount greater than zero.');
      return;
    }
    if (!this.form.partnerName.trim()) {
      this.toast.error('Select a document or enter a partner.');
      return;
    }

    this.service.registerPayment({
      journalId: this.form.journalId,
      paymentType: this.form.partnerType === 'customer' ? 'inbound' : 'outbound',
      partnerType: this.form.partnerType,
      partnerId: this.form.partnerId,
      partnerName: this.form.partnerName,
      amount: this.form.amount,
      currencyCode: this.form.currencyCode,
      paymentDate: this.form.paymentDate,
      paymentMethod: this.form.paymentMethod,
      reference: this.form.reference,
      moveIds: this.selected,
      autoPost: true,
    }).subscribe({
      next: () => { this.showRegister = false; this.toast.success('Payment posted.'); this.load(); },
      error: (err) => this.toast.error(err?.error?.message ?? 'Failed to post the payment.'),
    });
  }

  remove(payment: AccountPayment) {
    if (!confirm(`Delete payment ${payment.name}?`)) return;
    this.service.deletePayment(payment.id).subscribe({
      next: () => { this.toast.success('Payment deleted.'); this.load(); },
      error: (err) => this.toast.error(err?.error?.message ?? 'Failed to delete.'),
    });
  }

  private emptyForm() {
    return {
      journalId: 0,
      partnerType: 'customer' as 'customer' | 'supplier',
      partnerId: null as number | null,
      partnerName: '',
      amount: 0,
      currencyCode: 'USD',
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Bank Transfer',
      reference: '',
    };
  }
}
