import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { DataTable, TableColumn } from '../../../../shared/ui/data-table/data-table';
import { InvoiceFormModal } from './invoice-form-modal';
import { Invoice } from '../../data/invoices.mock';
import { AccountingService } from '../../services/accounting.service';
import { InvoicePdfService } from '../../services/invoice-pdf.service';
import { Customer } from '../../data/customers.mock';
import { InvoiceTemplateEditor } from '../../../../shared/ui/invoice-template-editor/invoice-template-editor';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, PageHeader, DataTable, InvoiceFormModal, InvoiceTemplateEditor],
  template: `
    <app-page-header title="Invoices" subtitle="Customer invoices & payment status" createLabel="New Invoice" (search)="onSearch($event)" (create)="openCreate()" />
    @if (loading) {
      <p>Loading invoices…</p>
    } @else if (error) {
      <p class="error">{{ error }}</p>
    } @else {
      <app-data-table [columns]="columns" [rows]="filteredRows" (edit)="openEdit($event)" (delete)="onDelete($event)" (template)="editTemplate($event)" (pdf)="downloadPdf($event)" (ledger)="viewLedger($event)" />
    }
    @if (showForm) {
      <app-invoice-form-modal
        [invoice]="editingRow"
        [customers]="customers"
        [existingInvoiceNumbers]="invoiceNumbers"
        (save)="onSave($event)"
        (cancel)="showForm = false"
      />
    }
    @if (showTemplateEditor && templateInvoice) { <app-invoice-template-editor [invoiceKey]="templateInvoice.invoiceNo" [invoiceNo]="templateInvoice.invoiceNo" [customerName]="templateInvoice.customer" [invoiceAmount]="templateInvoice.amount" [invoiceDate]="templateInvoice.dueDate" (cancel)="showTemplateEditor = false" (saved)="onTemplateSaved()" /> }
  `,
  styles: [`.error { color: #c0392b; } .template-actions { display:flex; justify-content:flex-end; margin:-8px 0 14px; } .template-actions button { align-items:center; background:#fff; border:1px solid #dedee5; border-radius:5px; color:#464feb; cursor:pointer; display:inline-flex; font:inherit; font-size:12px; gap:5px; padding:7px 10px; } .template-actions .material-symbols-outlined { font-size:16px; }`],
})
export class InvoiceList implements OnInit {
  private accountingService = inject(AccountingService);
  private router = inject(Router);
  private invoicePdf = inject(InvoicePdfService);
  customers: Customer[] = [];
  private toast = inject(ToastService);
  showTemplateEditor = false;
  templateInvoice: Invoice | null = null;

  columns: TableColumn[] = [
    { key: 'invoiceNo', label: 'Invoice No', type: 'link' },
    { key: 'customer', label: 'Customer' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'currency', label: 'Currency' },
    { key: 'pendingBalance', label: 'Pending Balance', type: 'currency' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'rowActions', label: '', type: 'invoice-row-actions' },
    { key: 'actions', label: '', type: 'actions' },
  ];

  allRows: Invoice[] = [];
  filteredRows: Invoice[] = [];
  invoiceNumbers: string[] = [];
  loading = true;
  error = '';
  showForm = false;
  editingRow: Invoice | null = null;

  ngOnInit() {
    this.loadData();
    this.accountingService.getCustomers().subscribe({ next: (customers) => { this.customers = customers.filter((customer) => customer.status === 'Active'); } });
  }

  loadData() {
    this.loading = true;
    this.accountingService.getAll().subscribe({
      next: (data) => {
        this.allRows = data;
        this.filteredRows = data;
        this.invoiceNumbers = data.map((row) => row.invoiceNo);
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load invoices. Is the Accounting API running?';
        this.loading = false;
      },
    });
  }

  onSearch(term: string) {
    const t = term.toLowerCase();
    this.filteredRows = this.allRows.filter((i) => i.customer.toLowerCase().includes(t) || i.invoiceNo.toLowerCase().includes(t));
  }

  openCreate() {
    this.editingRow = null;
    this.showForm = true;
  }

  openEdit(row: Invoice) {
    this.editingRow = row;
    this.showForm = true;
  }

  onSave(value: Record<string, unknown>) {
    if (this.editingRow) {
      const updated = { ...this.editingRow, ...value } as Invoice;
      this.accountingService.update(this.editingRow.id, updated).subscribe({
        next: () => {
          this.showForm = false;
          this.toast.success('Invoice updated successfully.');
          this.loadData();
        },
        error: (error) => this.toast.error(error?.error?.message ?? 'Failed to update the invoice.'),
      });
    } else {
      this.accountingService.create(value).subscribe({
        next: () => {
          this.showForm = false;
          this.toast.success('Invoice created successfully.');
          this.loadData();
        },
        error: (error) => this.toast.error(error?.error?.message ?? 'Failed to create the invoice.'),
      });
    }
  }

  onDelete(row: Invoice) {
    if (!confirm(`Delete invoice ${row.invoiceNo}?`)) return;
    this.accountingService.delete(row.id).subscribe({
      next: () => { this.toast.success('Invoice deleted.'); this.loadData(); },
      error: () => this.toast.error('Failed to delete the invoice.'),
    });
  }

  downloadPdf(invoice: Invoice) {
    this.invoicePdf.download(invoice, this.customers.find((customer) => customer.name === invoice.customer))
      .catch(() => this.toast.error('Failed to generate the invoice PDF. Check the logo or signature image format.'));
  }

  editTemplate(invoice: Invoice) {
    this.templateInvoice = invoice;
    this.showTemplateEditor = true;
  }

  viewLedger(invoice: Invoice) {
    this.router.navigate(['/accounting/journal-entries'], { queryParams: { ref: invoice.invoiceNo } });
  }

  onTemplateSaved() {
    this.showTemplateEditor = false;
    this.templateInvoice = null;
    this.toast.success('Invoice template saved.');
  }
}
