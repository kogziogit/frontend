import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Invoice, InvoiceItem } from '../../data/invoices.mock';
import { Customer } from '../../data/customers.mock';
import { ServiceCatalogService, ServiceCatalogItem } from '../../services/service-catalog.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

const CUSTOM_DESCRIPTION = '__custom__';

@Component({
  selector: 'app-invoice-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop">
      <form class="modal-card" (click)="$event.stopPropagation()" (ngSubmit)="submit()">
        <div class="modal-card__header">
          <h2>{{ invoice ? 'Edit Invoice' : 'New Invoice' }}</h2>
          <button type="button" class="icon-btn" (click)="cancel.emit()"><span class="material-symbols-outlined">close</span></button>
        </div>

        <div class="modal-card__body">
          <div class="header-fields">
            <label [class.invalid]="submitAttempted && !invoiceNo"><span class="field-label">Invoice No <span class="required-mark">*</span></span><input [(ngModel)]="invoiceNo" name="invoiceNo" placeholder="Select a client to auto-fill" required (ngModelChange)="invoiceNoManuallyEdited = true" /></label>
            <label [class.invalid]="submitAttempted && !customer"><span class="field-label">Customer <span class="required-mark">*</span></span>
              <select [(ngModel)]="customer" name="customer" required (ngModelChange)="onCustomerChange()">
                <option value="">Select a client</option>
                @for (c of customers; track c.id) { <option [ngValue]="c.name">{{ c.name }}</option> }
              </select>
            </label>
            <label [class.invalid]="submitAttempted && !dueDate"><span class="field-label">Due Date <span class="required-mark">*</span></span><input type="date" [(ngModel)]="dueDate" name="dueDate" required /></label>
            <label><span class="field-label">Currency</span>
              <select [(ngModel)]="currency" name="currency">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </label>
            <label><span class="field-label">Status</span>
              <select [(ngModel)]="status" name="status">
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </label>
            @if (status === 'Paid') {
              <label><span class="field-label">Amount Credited</span><input type="number" [(ngModel)]="amountCredited" name="amountCredited" /></label>
              <label><span class="field-label">Pending Balance</span><div class="field-readonly">{{ (totalAmount - (amountCredited || 0)).toFixed(2) }}</div></label>
            }
          </div>

          <div class="items-grid">
            <div class="items-header">
              <span>Service Description</span><span>HSN/SAC</span><span>Qty</span><span>Rate</span><span>Amount</span><span></span>
            </div>
            @for (row of rows; track row; let i = $index) {
              <div class="item-row">
                <div class="cell cell--description">
                  <span class="mobile-label">Service Description</span>
                  <select [(ngModel)]="row.selected" [name]="'desc' + i" (ngModelChange)="onDescriptionChange(row, $event)">
                    @for (opt of catalog; track opt.id) { <option [ngValue]="opt.serviceDescription">{{ opt.serviceDescription }}</option> }
                    <option [ngValue]="CUSTOM">Other (type manually)…</option>
                  </select>
                  @if (row.selected === CUSTOM) {
                    <input placeholder="Custom description" [(ngModel)]="row.item.serviceDescription" [name]="'customDesc' + i" />
                  }
                </div>
                <div class="cell cell--hsn"><span class="mobile-label">HSN/SAC</span><input [(ngModel)]="row.item.hsnSac" [name]="'hsn' + i" /></div>
                <div class="cell cell--qty"><span class="mobile-label">Qty</span><input type="number" min="0" step="0.01" [(ngModel)]="row.item.qty" [name]="'qty' + i" (ngModelChange)="recalculateRow(row)" /></div>
                <div class="cell cell--rate"><span class="mobile-label">Rate</span><input type="number" min="0" step="0.01" [(ngModel)]="row.item.rate" [name]="'rate' + i" (ngModelChange)="recalculateRow(row)" /></div>
                <div class="cell cell--amount"><span class="mobile-label">Amount</span><div class="amount-value">{{ row.item.amount.toFixed(2) }}</div></div>
                <button type="button" class="cell cell--remove icon-btn icon-btn--danger" title="Remove row" (click)="removeRow(i)"><span class="material-symbols-outlined">delete</span></button>
              </div>
            }
            <button type="button" class="add-row" (click)="addRow()"><span class="material-symbols-outlined">add</span> Add row</button>
            <div class="items-total">Total <strong>{{ totalAmount.toFixed(2) }}</strong></div>
          </div>

          <label class="notes-field"><span class="field-label">Notes</span><textarea rows="3" placeholder="Internal notes about this invoice (not shown on the PDF)" [(ngModel)]="notes" name="notes"></textarea></label>
        </div>

        <div class="modal-card__footer">
          <button type="button" class="btn btn--ghost" (click)="cancel.emit()">Cancel</button>
          <button type="submit" class="btn btn--primary">Save</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 16px; box-sizing: border-box; }
    .modal-card { width: min(920px, 96vw); max-height: 90vh; overflow: hidden; background: #fff; border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 16px; box-sizing: border-box; }
    .modal-card__header { display: flex; align-items: center; justify-content: space-between; }
    .modal-card__header h2 { margin: 0; font-size: 17px; color: #2b2b33; }
    .icon-btn { border: none; background: transparent; color: #6b6b76; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .icon-btn:hover { color: #2b2b33; }
    .icon-btn--danger:hover { color: #c0392b; }
    .modal-card__body { overflow-y: auto; overflow-x: hidden; display: flex; flex-direction: column; gap: 16px; padding-right: 4px; }
    .header-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
    .header-fields label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #47474d; min-width: 0; }
    .field-label { display: inline-flex; align-items: baseline; gap: 2px; }
    .required-mark { color: #c0392b; }
    input, select { border: 1px solid #e6e6e6; border-radius: 6px; padding: 8px 10px; font-size: 13px; font: inherit; width: 100%; box-sizing: border-box; min-width: 0; }
    .field-readonly { background: #f5f5f8; border: 1px solid #e6e6e6; border-radius: 6px; padding: 8px 10px; font-size: 13px; font-weight: 600; color: #2b2b33; }
    .items-grid { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .items-header, .item-row { display: grid; grid-template-columns: minmax(140px, 1fr) 110px 64px 84px 84px 32px; gap: 8px; align-items: center; min-width: 0; }
    .items-header { font-size: 12px; color: #77778a; font-weight: 600; padding: 0 2px; }
    .cell { min-width: 0; }
    .cell--description { display: flex; flex-direction: column; gap: 4px; }
    .cell--amount .amount-value { font-size: 13px; font-weight: 600; color: #2b2b33; text-align: right; padding-right: 4px; }
    .cell--remove { padding: 4px; }
    .mobile-label { display: none; font-size: 11px; color: #77778a; margin-bottom: 2px; }
    .add-row { align-self: flex-start; display: inline-flex; align-items: center; gap: 4px; background: none; border: 1px dashed #c7c7d6; color: #464feb; border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 13px; }
    .items-total { align-self: flex-end; font-size: 14px; color: #2b2b33; }
    .notes-field { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #47474d; }
    .notes-field textarea { font: inherit; }
    label.invalid .field-label { color: #c0392b; }
    label.invalid input, label.invalid select { border-color: #c0392b; }
    .modal-card__footer { display: flex; justify-content: flex-end; gap: 10px; }
    .btn { border-radius: 5px; cursor: pointer; font: inherit; font-size: 13px; padding: 9px 14px; border: 1px solid transparent; }
    .btn--ghost { background: #fff; border-color: #ddd; color: #555; }
    .btn--primary { background: #464feb; border-color: #464feb; color: #fff; }
    @media (max-width: 720px) {
      .items-header { display: none; }
      .item-row { grid-template-columns: 1fr 1fr; }
      .cell--remove { justify-self: end; grid-column: 2 / 3; }
      .mobile-label { display: block; }
      .cell--amount .amount-value { text-align: left; padding-right: 0; }
    }
  `],
})
export class InvoiceFormModal implements OnInit {
  @Input() invoice: Invoice | null = null;
  @Input() customers: Customer[] = [];
  @Input() existingInvoiceNumbers: string[] = [];
  @Output() save = new EventEmitter<Record<string, unknown>>();
  @Output() cancel = new EventEmitter<void>();

  private catalogService = inject(ServiceCatalogService);
  private toast = inject(ToastService);
  readonly CUSTOM = CUSTOM_DESCRIPTION;

  invoiceNo = '';
  invoiceNoManuallyEdited = false;
  customer = '';
  dueDate = '';
  currency = 'USD';
  status: 'Paid' | 'Pending' | 'Overdue' = 'Pending';
  amountCredited = 0;
  notes = '';
  submitAttempted = false;
  catalog: ServiceCatalogItem[] = [];
  rows: { selected: string; item: InvoiceItem }[] = [];

  ngOnInit() {
    if (this.invoice) {
      this.invoiceNo = this.invoice.invoiceNo;
      this.customer = this.invoice.customer;
      this.dueDate = this.invoice.dueDate?.slice(0, 10) ?? '';
      this.currency = this.invoice.currency ?? 'USD';
      this.status = this.invoice.status;
      this.amountCredited = this.invoice.amountCredited ?? 0;
      this.notes = this.invoice.notes ?? '';
    }
    this.catalogService.getAll().subscribe((catalog) => {
      this.catalog = catalog;
      this.rows = this.buildRows();
    });
    if (!this.invoice || !this.invoice.items?.length) this.rows = this.buildRows();
    if (!this.invoice && this.customer) this.invoiceNo = this.generateInvoiceNo(this.customer);
  }

  onCustomerChange() {
    if (this.invoice || this.invoiceNoManuallyEdited) return; // number is fixed once an invoice exists or the user typed their own
    this.invoiceNo = this.customer ? this.generateInvoiceNo(this.customer) : '';
  }

  private generateInvoiceNo(customerName: string): string {
    const customer = this.customers.find((c) => c.name === customerName);
    const prefix = customer?.invoicePrefix?.trim() || 'INV';
    const year = new Date().getFullYear();
    const pattern = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-${year}-(\\d+)$`);
    let maxSeq = 0;
    for (const no of this.existingInvoiceNumbers) {
      const match = pattern.exec(no);
      if (match) maxSeq = Math.max(maxSeq, parseInt(match[1], 10));
    }
    return `${prefix}-${year}-${(maxSeq + 1).toString().padStart(3, '0')}`;
  }

  private buildRows(): { selected: string; item: InvoiceItem }[] {
    const items = this.invoice?.items?.length
      ? this.invoice.items
      : [{ serviceDescription: this.invoice?.serviceDescription || 'Professional services', hsnSac: this.invoice?.hsnSac || '998313', qty: 1, rate: this.invoice?.amount ?? 0, amount: this.invoice?.amount ?? 0 }];
    return items.map((item) => ({
      selected: this.catalog.some((c) => c.serviceDescription === item.serviceDescription) ? item.serviceDescription : this.CUSTOM,
      item: { ...item },
    }));
  }

  get totalAmount(): number {
    return this.rows.reduce((sum, row) => sum + (Number(row.item.amount) || 0), 0);
  }

  onDescriptionChange(row: { selected: string; item: InvoiceItem }, value: string) {
    if (value === this.CUSTOM) return;
    const match = this.catalog.find((c) => c.serviceDescription === value);
    row.item.serviceDescription = value;
    if (match) row.item.hsnSac = match.hsnSac;
  }

  recalculateRow(row: { selected: string; item: InvoiceItem }) {
    row.item.amount = (Number(row.item.qty) || 0) * (Number(row.item.rate) || 0);
  }

  addRow() {
    this.rows.push({ selected: this.catalog[0]?.serviceDescription ?? this.CUSTOM, item: { serviceDescription: this.catalog[0]?.serviceDescription ?? '', hsnSac: this.catalog[0]?.hsnSac ?? '998313', qty: 1, rate: 0, amount: 0 } });
  }

  removeRow(index: number) {
    if (this.rows.length === 1) return;
    this.rows.splice(index, 1);
  }

  submit() {
    this.submitAttempted = true;
    if (!this.invoiceNo || !this.customer || !this.dueDate) {
      this.toast.error('Please fill in all required fields (highlighted in red).');
      return;
    }
    const items = this.rows.map((row, index) => ({ ...row.item, sortOrder: index }));
    const primary = items[0];
    this.save.emit({
      invoiceNo: this.invoiceNo,
      customer: this.customer,
      dueDate: this.dueDate,
      currency: this.currency,
      status: this.status,
      amountCredited: this.status === 'Paid' ? this.amountCredited : 0,
      amount: this.totalAmount,
      serviceDescription: primary?.serviceDescription ?? '',
      hsnSac: primary?.hsnSac ?? '998313',
      notes: this.notes,
      items,
    });
  }
}
