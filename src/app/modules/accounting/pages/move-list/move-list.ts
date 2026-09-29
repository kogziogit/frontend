import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { HasPermissionDirective } from '../../../../core/auth/has-permission.directive';
import { InvoiceTemplateEditor } from '../../../../shared/ui/invoice-template-editor/invoice-template-editor';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import {
  AccountingCoreService, AccountJournal, AccountMove, AccountTax, MoveType, SaveMoveLineRequest,
} from '../../services/accounting-core.service';
import { AccountingService } from '../../services/accounting.service';
import { LedgerService } from '../../services/ledger.service';
import { InvoicePdfService } from '../../services/invoice-pdf.service';
import { ServiceCatalogService, ServiceCatalogItem } from '../../services/service-catalog.service';
import { Customer } from '../../data/customers.mock';
import { Invoice } from '../../data/invoices.mock';
import { ChartOfAccount } from '../../data/ledger.mock';
import { CURRENCIES } from '../../../../shared/data/currencies';

interface EditorLine extends SaveMoveLineRequest {
  subtotal: number;
  /** Description was typed by hand rather than picked from the catalog. */
  custom: boolean;
}

const CUSTOM_DESCRIPTION = '__custom__';

@Component({
  selector: 'app-move-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeader, HasPermissionDirective, InvoiceTemplateEditor],
  templateUrl: './move-list.html',
  styleUrl: './move-list.scss',
})
export class MoveList implements OnInit {
  currencies = CURRENCIES;
  private service = inject(AccountingCoreService);
  private accounting = inject(AccountingService);
  private ledger = inject(LedgerService);
  private invoicePdf = inject(InvoicePdfService);
  private serviceCatalog = inject(ServiceCatalogService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  moveType: MoveType = 'out_invoice';
  isSale = true;

  moves: AccountMove[] = [];
  filtered: AccountMove[] = [];
  journals: AccountJournal[] = [];
  taxes: AccountTax[] = [];
  accounts: ChartOfAccount[] = [];
  customers: Customer[] = [];
  catalog: ServiceCatalogItem[] = [];

  showTemplateEditor = false;
  templateMove: AccountMove | null = null;

  loading = true;
  error = '';
  stateFilter = 'all';

  showEditor = false;
  editing: AccountMove | null = null;
  form = this.emptyForm();
  lines: EditorLine[] = [];
  invoiceNoManuallyEdited = false;

  showPayment = false;
  paymentTarget: AccountMove | null = null;
  payment = { journalId: 0, amount: 0, paymentDate: this.today(), paymentMethod: 'Bank Transfer', reference: '' };

  ngOnInit() {
    this.moveType = (this.route.snapshot.data['moveType'] as MoveType) ?? 'out_invoice';
    this.isSale = this.moveType === 'out_invoice';

    this.serviceCatalog.getAll().subscribe({
      next: (items) => (this.catalog = items),
      error: () => (this.catalog = []),
    });

    forkJoin({
      journals: this.service.getJournals(),
      taxes: this.service.getTaxes(),
      accounts: this.ledger.getAccounts(),
      customers: this.accounting.getCustomers(),
    }).subscribe({
      next: ({ journals, taxes, accounts, customers }) => {
        this.journals = journals.filter((j) => j.isActive);
        this.taxes = taxes.filter((t) => t.isActive && t.typeTaxUse === (this.isSale ? 'sale' : 'purchase'));
        this.accounts = accounts.filter((a: ChartOfAccount) => a.isActive);
        this.customers = customers;
        this.load();
      },
      error: () => {
        this.error = 'Failed to load accounting configuration.';
        this.loading = false;
      },
    });
  }

  load() {
    this.loading = true;
    this.service.getMoves(this.moveType).subscribe({
      next: (moves) => {
        this.moves = moves;
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load documents.';
        this.loading = false;
      },
    });
  }

  applyFilter(term = '') {
    const t = term.toLowerCase();
    this.filtered = this.moves.filter((m) => {
      const matchesState = this.stateFilter === 'all'
        || (this.stateFilter === 'unpaid' ? m.state === 'posted' && m.paymentState !== 'paid' : m.state === this.stateFilter);
      const matchesTerm = !t || `${m.name} ${m.partnerName ?? ''} ${m.reference ?? ''}`.toLowerCase().includes(t);
      return matchesState && matchesTerm;
    });
  }

  // ------------------------------------------------------------ editor

  get defaultJournal() {
    return this.journals.find((j) => j.type === (this.isSale ? 'sale' : 'purchase'));
  }

  openCreate() {
    this.editing = null;
    this.form = this.emptyForm();
    this.form.journalId = this.defaultJournal?.id ?? this.journals[0]?.id ?? 0;
    this.form.invoiceNumber = this.generateInvoiceNumber('');
    this.invoiceNoManuallyEdited = false;
    this.lines = [this.emptyLine()];
    this.showEditor = true;
  }

  openEdit(move: AccountMove) {
    if (move.state !== 'draft') {
      this.openView(move);
      return;
    }
    this.editing = move;
    this.form = {
      invoiceNumber: move.invoiceNumber ?? this.generateInvoiceNumber(move.partnerName ?? ''),
      journalId: move.journalId,
      partnerId: move.partnerId ?? null,
      partnerName: move.partnerName ?? '',
      date: move.date,
      invoiceDate: move.invoiceDate ?? move.date,
      dueDate: move.dueDate ?? move.date,
      reference: move.reference ?? '',
      narration: move.narration ?? '',
      currencyCode: move.currencyCode,
    };
    this.lines = move.lines
      .filter((l) => l.displayType === 'product')
      .map((l) => ({
        accountId: l.accountId,
        name: l.name ?? '',
        quantity: l.quantity,
        priceUnit: l.priceUnit,
        discount: l.discount,
        taxIds: [...l.taxIds],
        hsnSac: l.hsnSac ?? '',
        subtotal: 0,
        custom: this.isCustomDescription(l.name),
      }));
    if (!this.lines.length) this.lines = [this.emptyLine()];
    this.recalc();
    this.showEditor = true;
  }

  openView(move: AccountMove) {
    this.service.getMove(move.id).subscribe((full) => {
      this.editing = full;
      this.showEditor = true;
      this.form = {
        invoiceNumber: full.invoiceNumber ?? this.generateInvoiceNumber(full.partnerName ?? ''),
        journalId: full.journalId,
        partnerId: full.partnerId ?? null,
        partnerName: full.partnerName ?? '',
        date: full.date,
        invoiceDate: full.invoiceDate ?? full.date,
        dueDate: full.dueDate ?? full.date,
        reference: full.reference ?? '',
        narration: full.narration ?? '',
        currencyCode: full.currencyCode,
      };
      this.lines = full.lines
        .filter((l) => l.displayType === 'product')
        .map((l) => ({
          accountId: l.accountId, name: l.name ?? '', quantity: l.quantity,
          priceUnit: l.priceUnit, discount: l.discount, taxIds: [...l.taxIds],
          hsnSac: l.hsnSac ?? '', subtotal: 0, custom: this.isCustomDescription(l.name),
        }));
      this.recalc();
    });
  }

  get readOnly() {
    return !!this.editing && this.editing.state !== 'draft';
  }

  addLine() {
    this.lines = [...this.lines, this.emptyLine()];
  }

  removeLine(index: number) {
    this.lines = this.lines.filter((_, i) => i !== index);
    if (!this.lines.length) this.lines = [this.emptyLine()];
    this.recalc();
  }

  toggleTax(line: EditorLine, taxId: number) {
    line.taxIds = line.taxIds.includes(taxId)
      ? line.taxIds.filter((id) => id !== taxId)
      : [...line.taxIds, taxId];
    this.recalc();
  }

  recalc() {
    for (const line of this.lines) {
      line.subtotal = Math.round(line.quantity * line.priceUnit * (1 - (line.discount || 0) / 100) * 100) / 100;
    }
  }

  get untaxedTotal() {
    return this.lines.reduce((sum, l) => sum + (l.subtotal || 0), 0);
  }

  get taxTotal() {
    return this.lines.reduce((sum, line) => {
      const lineTaxes = this.taxes.filter((t) => line.taxIds.includes(t.id));
      return sum + lineTaxes.reduce((s, t) => s + (t.amountType === 'fixed' ? t.amount : (line.subtotal || 0) * t.amount / 100), 0);
    }, 0);
  }

  get grandTotal() {
    return this.untaxedTotal + this.taxTotal;
  }

  save(thenPost = false) {
    if (!this.form.partnerName?.trim()) {
      this.toast.error(this.isSale ? 'Choose a customer.' : 'Enter a vendor.');
      return;
    }
    const usable = this.lines.filter((l) => l.subtotal !== 0 || l.name?.trim());
    if (!usable.length) {
      this.toast.error('Add at least one line.');
      return;
    }

    const request = {
      journalId: this.form.journalId,
      moveType: this.moveType,
      invoiceNumber: this.form.invoiceNumber,
      partnerId: this.form.partnerId,
      partnerName: this.form.partnerName,
      date: this.form.date,
      invoiceDate: this.form.invoiceDate,
      dueDate: this.form.dueDate,
      reference: this.form.reference,
      narration: this.form.narration,
      currencyCode: this.form.currencyCode,
      lines: usable.map((l) => ({
        accountId: l.accountId ?? null,
        name: l.name,
        quantity: l.quantity,
        priceUnit: l.priceUnit,
        discount: l.discount,
        taxIds: l.taxIds,
        hsnSac: l.hsnSac,
      })),
    };

    const call = this.editing
      ? this.service.updateMove(this.editing.id, request)
      : this.service.createMove(request);

    call.subscribe({
      next: (saved) => {
        this.toast.success('Draft saved.');
        if (thenPost) {
          this.post(saved, true);
        } else {
          this.showEditor = false;
          this.load();
        }
      },
      error: (err) => this.toast.error(err?.error?.message ?? 'Failed to save the draft.'),
    });
  }

  post(move: AccountMove, closeEditor = false) {
    this.service.postMove(move.id).subscribe({
      next: (posted) => {
        this.toast.success(`${posted.name} posted.`);
        if (closeEditor) this.showEditor = false;
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.message ?? 'Failed to post.'),
    });
  }

  resetToDraft(move: AccountMove) {
    this.service.resetMoveToDraft(move.id).subscribe({
      next: () => { this.toast.success('Reset to draft.'); this.showEditor = false; this.load(); },
      error: (err) => this.toast.error(err?.error?.message ?? 'Cannot reset this entry.'),
    });
  }

  reverse(move: AccountMove) {
    const reason = prompt(`Reason for reversing ${move.name}?`, 'Correction');
    if (reason === null) return;
    this.service.reverseMove(move.id, { date: this.today(), reason, reconcile: true }).subscribe({
      next: (credit) => { this.toast.success(`${credit.name} created.`); this.showEditor = false; this.load(); },
      error: (err) => this.toast.error(err?.error?.message ?? 'Failed to reverse.'),
    });
  }

  remove(move: AccountMove) {
    if (!confirm(`Delete draft ${move.name === '/' ? '(unnumbered)' : move.name}?`)) return;
    this.service.deleteMove(move.id).subscribe({
      next: () => { this.toast.success('Draft deleted.'); this.load(); },
      error: (err) => this.toast.error(err?.error?.message ?? 'Failed to delete.'),
    });
  }

  // ------------------------------------------------------------ payment

  openPayment(move: AccountMove) {
    this.paymentTarget = move;
    const bank = this.journals.find((j) => j.type === 'bank') ?? this.journals.find((j) => j.type === 'cash');
    this.payment = {
      journalId: bank?.id ?? 0,
      amount: move.amountResidual,
      paymentDate: this.today(),
      paymentMethod: 'Bank Transfer',
      reference: move.name,
    };
    this.showPayment = true;
  }

  registerPayment() {
    if (!this.paymentTarget) return;
    if (this.payment.amount <= 0) {
      this.toast.error('Enter an amount greater than zero.');
      return;
    }

    this.service.registerPayment({
      journalId: this.payment.journalId,
      paymentType: this.isSale ? 'inbound' : 'outbound',
      partnerType: this.isSale ? 'customer' : 'supplier',
      partnerId: this.paymentTarget.partnerId,
      partnerName: this.paymentTarget.partnerName,
      amount: this.payment.amount,
      currencyCode: this.paymentTarget.currencyCode,
      paymentDate: this.payment.paymentDate,
      paymentMethod: this.payment.paymentMethod,
      reference: this.payment.reference,
      moveIds: [this.paymentTarget.id],
      autoPost: true,
    }).subscribe({
      next: () => { this.showPayment = false; this.toast.success('Payment registered.'); this.load(); },
      error: (err) => this.toast.error(err?.error?.message ?? 'Failed to register the payment.'),
    });
  }

  // ------------------------------------------------------------ helpers

  onCustomerChange(name: string) {
    this.form.partnerName = name;
    this.form.partnerId = this.customers.find((c) => c.name === name)?.id ?? null;
    if (!this.editing && !this.invoiceNoManuallyEdited) this.form.invoiceNumber = this.generateInvoiceNumber(name);
  }

  onInvoiceNumberChange(value: string) {
    this.form.invoiceNumber = value;
    this.invoiceNoManuallyEdited = true;
  }

  /** Picking a catalogued service fills in its HSN/SAC. */
  onDescriptionSelect(line: EditorLine, value: string) {
    if (value === CUSTOM_DESCRIPTION) {
      line.custom = true;
      line.name = '';
      return;
    }

    line.custom = false;
    line.name = value;
    const match = this.catalog.find((c) => c.serviceDescription === value);
    if (match) line.hsnSac = match.hsnSac;
  }

  descriptionSelection(line: EditorLine) {
    return line.custom ? CUSTOM_DESCRIPTION : line.name ?? '';
  }

  downloadPdf(move: AccountMove) {
    const render = (full: AccountMove) =>
      this.invoicePdf
        .download(this.toInvoice(full), this.customers.find((c) => c.name === full.partnerName))
        .catch(() => this.toast.error('Failed to generate the PDF. Check the logo or signature image format.'));

    if (move.lines?.length) {
      render(move);
    } else {
      this.service.getMove(move.id).subscribe((full) => render(full));
    }
  }

  editTemplate(move: AccountMove) {
    this.templateMove = move;
    this.showTemplateEditor = true;
  }

  onTemplateSaved() {
    this.showTemplateEditor = false;
    this.templateMove = null;
    this.toast.success('Invoice template saved.');
  }

  /** Maps a posted move onto the shape the PDF renderer expects. */
  private toInvoice(move: AccountMove): Invoice {
    const products = move.lines.filter((l) => l.displayType === 'product');
    const due = move.dueDate ?? move.date;
    const overdue = move.amountResidual > 0 && new Date(due) < new Date();

    return {
      id: move.id,
      invoiceNo: move.name === '/' ? 'DRAFT' : move.name,
      customer: move.partnerName ?? '',
      dueDate: due,
      amount: move.amountTotal,
      status: move.paymentState === 'paid' ? 'Paid' : overdue ? 'Overdue' : 'Pending',
      currency: move.currencyCode,
      amountCredited: move.amountPaid,
      pendingBalance: move.amountResidual,
      notes: move.narration ?? undefined,
      serviceDescription: products[0]?.name ?? undefined,
      hsnSac: products[0]?.hsnSac ?? undefined,
      items: products.map((l, index) => ({
        serviceDescription: l.name ?? '',
        hsnSac: l.hsnSac ?? '',
        qty: l.quantity,
        rate: l.priceUnit,
        amount: Math.round(l.quantity * l.priceUnit * (1 - (l.discount || 0) / 100) * 100) / 100,
        sortOrder: index,
      })),
    };
  }

  stateLabel(move: AccountMove) {
    if (move.state === 'draft') return 'Draft';
    if (move.state === 'cancel') return 'Cancelled';
    return move.paymentState === 'paid' ? 'Paid'
      : move.paymentState === 'partial' ? 'Partial'
      : 'Posted';
  }

  private isCustomDescription(name?: string | null) {
    return !!name?.trim() && !this.catalog.some((c) => c.serviceDescription === name);
  }

  private emptyForm() {
    return {
      invoiceNumber: '',
      journalId: 0,
      partnerId: null as number | null,
      partnerName: '',
      date: this.today(),
      invoiceDate: this.today(),
      dueDate: this.today(),
      reference: '',
      narration: '',
      currencyCode: 'USD',
    };
  }

  private generateInvoiceNumber(customerName: string) {
    const customer = this.customers.find((c) => c.name === customerName);
    const prefix = customer?.invoicePrefix?.trim() || 'INV';
    const year = new Date().getFullYear();
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^${escaped}-${year}-(\\d+)$`);
    let maxSequence = 0;
    for (const move of this.moves) {
      const match = pattern.exec(move.name);
      if (match) maxSequence = Math.max(maxSequence, Number.parseInt(match[1], 10));
    }
    return `${prefix}-${year}-${String(maxSequence + 1).padStart(3, '0')}`;
  }

  private emptyLine(): EditorLine {
    return { accountId: null, name: '', quantity: 1, priceUnit: 0, discount: 0, taxIds: [], hsnSac: '', subtotal: 0, custom: false };
  }

  private today() {
    return new Date().toISOString().slice(0, 10);
  }
}
