import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataTable, TableColumn } from '../../../../shared/ui/data-table/data-table';
import { ChartOfAccount, LedgerLine, TrialBalanceRow } from '../../data/ledger.mock';
import { LedgerService } from '../../services/ledger.service';

@Component({
  selector: 'app-general-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTable],
  template: `
    <section class="panel">
      <h2>Trial Balance</h2>
      @if (loadingTrialBalance) {
        <p>Loading…</p>
      } @else {
        <app-data-table [columns]="trialBalanceColumns" [rows]="trialBalance" />
        <div class="totals">Total Debit: <strong>{{ totalDebit.toFixed(2) }}</strong> · Total Credit: <strong>{{ totalCredit.toFixed(2) }}</strong></div>
      }
    </section>

    <section class="panel">
      <div class="ledger-heading">
        <h2>Account Ledger</h2>
        <select [(ngModel)]="selectedAccountId" (ngModelChange)="loadLedger()">
          <option [ngValue]="0">Select an account</option>
          @for (a of accounts; track a.id) { <option [ngValue]="a.id">{{ a.code }} - {{ a.name }}</option> }
        </select>
      </div>
      @if (selectedAccountId) {
        @if (loadingLedger) {
          <p>Loading ledger…</p>
        } @else {
          <app-data-table [columns]="ledgerColumns" [rows]="ledgerLines" />
        }
      }
    </section>
  `,
  styles: [`
    .panel { background: #fff; border: 1px solid #e2e2e8; border-radius: 8px; margin-bottom: 16px; padding: 18px; }
    .panel h2 { color: #292934; font-size: 16px; margin: 0 0 12px; }
    .totals { color: #292934; font-size: 13px; margin-top: 10px; text-align: right; }
    .ledger-heading { align-items: center; display: flex; justify-content: space-between; margin-bottom: 12px; }
    .ledger-heading select { border: 1px solid #dedee5; border-radius: 5px; padding: 8px 10px; }
  `],
})
export class GeneralLedger implements OnInit {
  private ledgerService = inject(LedgerService);

  trialBalanceColumns: TableColumn[] = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Account' },
    { key: 'type', label: 'Type', type: 'badge' },
    { key: 'totalDebit', label: 'Total Debit', type: 'currency' },
    { key: 'totalCredit', label: 'Total Credit', type: 'currency' },
    { key: 'balance', label: 'Balance', type: 'currency' },
  ];

  ledgerColumns: TableColumn[] = [
    { key: 'entryDate', label: 'Date', type: 'date' },
    { key: 'entryNo', label: 'Entry No' },
    { key: 'description', label: 'Description' },
    { key: 'sourceReference', label: 'Reference' },
    { key: 'debit', label: 'Debit', type: 'currency' },
    { key: 'credit', label: 'Credit', type: 'currency' },
    { key: 'runningBalance', label: 'Balance', type: 'currency' },
  ];

  accounts: ChartOfAccount[] = [];
  trialBalance: TrialBalanceRow[] = [];
  ledgerLines: LedgerLine[] = [];
  selectedAccountId = 0;
  loadingTrialBalance = true;
  loadingLedger = false;

  get totalDebit(): number { return this.trialBalance.reduce((sum, r) => sum + r.totalDebit, 0); }
  get totalCredit(): number { return this.trialBalance.reduce((sum, r) => sum + r.totalCredit, 0); }

  ngOnInit() {
    this.ledgerService.getAccounts().subscribe((accounts) => this.accounts = accounts);
    this.ledgerService.getTrialBalance().subscribe({
      next: (rows) => { this.trialBalance = rows; this.loadingTrialBalance = false; },
      error: () => this.loadingTrialBalance = false,
    });
  }

  loadLedger() {
    if (!this.selectedAccountId) { this.ledgerLines = []; return; }
    this.loadingLedger = true;
    this.ledgerService.getLedger(this.selectedAccountId).subscribe({
      next: (lines) => { this.ledgerLines = lines; this.loadingLedger = false; },
      error: () => this.loadingLedger = false,
    });
  }
}
