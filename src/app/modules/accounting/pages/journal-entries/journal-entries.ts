import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { DataTable, TableColumn } from '../../../../shared/ui/data-table/data-table';
import { ChartOfAccount, JournalEntry } from '../../data/ledger.mock';
import { LedgerService } from '../../services/ledger.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

interface JournalLineRow {
  entryNo: string;
  entryDate: string;
  description: string;
  sourceModule: string;
  sourceReference?: string | null;
  accountLabel: string;
  debit: number;
  credit: number;
}

@Component({
  selector: 'app-journal-entries',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeader, DataTable],
  template: `
    <app-page-header title="Journal Entries" subtitle="Every posting across the General Ledger, auto-posted or manual" createLabel="New Manual Entry" (search)="onSearch($event)" (create)="showForm = true" />

    @if (loading) {
      <p>Loading journal entries…</p>
    } @else if (error) {
      <p class="error">{{ error }}</p>
    } @else {
      <app-data-table [columns]="columns" [rows]="filteredRows" />
    }

    @if (showForm) {
      <div class="modal-backdrop" (click)="showForm = false">
        <form class="modal-card" (click)="$event.stopPropagation()" (ngSubmit)="save()">
          <h2>New Manual Journal Entry</h2>
          <label>Description<input [(ngModel)]="description" name="description" required /></label>
          <label>Date<input type="date" [(ngModel)]="entryDate" name="entryDate" required /></label>
          <div class="row">
            <label>Debit Account
              <select [(ngModel)]="debitAccountId" name="debitAccountId" required>
                <option [ngValue]="0">Select account</option>
                @for (a of accounts; track a.id) { <option [ngValue]="a.id">{{ a.code }} - {{ a.name }}</option> }
              </select>
            </label>
            <label>Credit Account
              <select [(ngModel)]="creditAccountId" name="creditAccountId" required>
                <option [ngValue]="0">Select account</option>
                @for (a of accounts; track a.id) { <option [ngValue]="a.id">{{ a.code }} - {{ a.name }}</option> }
              </select>
            </label>
          </div>
          <label>Amount<input type="number" min="0.01" step="0.01" [(ngModel)]="amount" name="amount" required /></label>
          <div class="footer">
            <button type="button" class="btn btn--ghost" (click)="showForm = false">Cancel</button>
            <button type="submit" class="btn btn--primary">Post Entry</button>
          </div>
        </form>
      </div>
    }
  `,
  styles: [`
    .error { color: #c0392b; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; z-index: 50; }
    .modal-card { width: 420px; max-width: calc(100vw - 32px); background: #fff; border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
    .modal-card h2 { margin: 0; font-size: 17px; color: #2b2b33; }
    .modal-card label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #47474d; }
    .modal-card input, .modal-card select { border: 1px solid #e6e6e6; border-radius: 6px; padding: 8px 10px; font-size: 13px; font: inherit; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }
    .btn { border: 0; border-radius: 5px; cursor: pointer; font: inherit; font-size: 13px; padding: 9px 14px; }
    .btn--ghost { background: #fff; border: 1px solid #ddd; color: #555; }
    .btn--primary { background: #464feb; color: #fff; }
  `],
})
export class JournalEntries implements OnInit {
  private ledgerService = inject(LedgerService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  columns: TableColumn[] = [
    { key: 'entryDate', label: 'Date', type: 'date' },
    { key: 'entryNo', label: 'Entry No' },
    { key: 'description', label: 'Description' },
    { key: 'accountLabel', label: 'Account' },
    { key: 'debit', label: 'Debit', type: 'currency' },
    { key: 'credit', label: 'Credit', type: 'currency' },
    { key: 'sourceModule', label: 'Source' },
    { key: 'sourceReference', label: 'Reference' },
  ];

  accounts: ChartOfAccount[] = [];
  allRows: JournalLineRow[] = [];
  filteredRows: JournalLineRow[] = [];
  loading = true;
  error = '';
  showForm = false;

  description = '';
  entryDate = new Date().toISOString().slice(0, 10);
  debitAccountId = 0;
  creditAccountId = 0;
  amount = 0;

  ngOnInit() {
    this.ledgerService.getAccounts().subscribe((accounts) => this.accounts = accounts);
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.ledgerService.getJournalEntries().subscribe({
      next: (entries) => {
        this.allRows = this.flatten(entries);
        const ref = this.route.snapshot.queryParamMap.get('ref');
        this.filteredRows = ref ? this.allRows.filter((r) => r.sourceReference === ref) : this.allRows;
        this.loading = false;
      },
      error: () => { this.error = 'Failed to load journal entries.'; this.loading = false; },
    });
  }

  private flatten(entries: JournalEntry[]): JournalLineRow[] {
    const rows: JournalLineRow[] = [];
    for (const entry of entries) {
      for (const line of entry.lines) {
        rows.push({
          entryNo: entry.entryNo,
          entryDate: entry.entryDate,
          description: line.description || entry.description,
          sourceModule: entry.sourceModule,
          sourceReference: entry.sourceReference,
          accountLabel: `${line.accountCode ?? ''} ${line.accountName ?? ''}`.trim(),
          debit: line.debit,
          credit: line.credit,
        });
      }
    }
    return rows;
  }

  onSearch(term: string) {
    const t = term.toLowerCase();
    this.filteredRows = this.allRows.filter((r) => `${r.entryNo} ${r.description} ${r.accountLabel} ${r.sourceReference ?? ''}`.toLowerCase().includes(t));
  }

  save() {
    if (!this.debitAccountId || !this.creditAccountId || this.amount <= 0) {
      this.toast.error('Select both accounts and a positive amount.');
      return;
    }
    if (this.debitAccountId === this.creditAccountId) {
      this.toast.error('Debit and credit accounts must be different.');
      return;
    }
    const entry: Partial<JournalEntry> = {
      description: this.description,
      entryDate: this.entryDate,
      lines: [
        { accountId: this.debitAccountId, debit: this.amount, credit: 0 },
        { accountId: this.creditAccountId, debit: 0, credit: this.amount },
      ],
    };
    this.ledgerService.createJournalEntry(entry).subscribe({
      next: () => {
        this.showForm = false;
        this.toast.success('Journal entry posted.');
        this.description = ''; this.debitAccountId = 0; this.creditAccountId = 0; this.amount = 0;
        this.loadData();
      },
      error: (error) => this.toast.error(error?.error?.message ?? 'Failed to post the journal entry.'),
    });
  }
}
