import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import {
  AccountingCoreService, AgedBalanceRow, FinancialReportLine, TaxReportRow, TrialBalanceRow,
} from '../../services/accounting-core.service';

type ReportKey = 'trial-balance' | 'profit-and-loss' | 'balance-sheet' | 'aged-receivable' | 'aged-payable' | 'tax';

@Component({
  selector: 'app-financial-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeader],
  templateUrl: './financial-reports.html',
  styleUrl: './financial-reports.scss',
})
export class FinancialReports implements OnInit {
  private service = inject(AccountingCoreService);
  private toast = inject(ToastService);

  readonly reports: { key: ReportKey; label: string }[] = [
    { key: 'trial-balance', label: 'Trial Balance' },
    { key: 'profit-and-loss', label: 'Profit & Loss' },
    { key: 'balance-sheet', label: 'Balance Sheet' },
    { key: 'aged-receivable', label: 'Aged Receivable' },
    { key: 'aged-payable', label: 'Aged Payable' },
    { key: 'tax', label: 'Tax Report' },
  ];

  active: ReportKey = 'trial-balance';
  dateFrom = `${new Date().getFullYear()}-01-01`;
  dateTo = new Date().toISOString().slice(0, 10);
  includeDraft = false;
  loading = false;

  trialBalance: TrialBalanceRow[] = [];
  financial: FinancialReportLine[] = [];
  aged: AgedBalanceRow[] = [];
  taxRows: TaxReportRow[] = [];

  ngOnInit() {
    this.run();
  }

  select(key: ReportKey) {
    this.active = key;
    this.run();
  }

  run() {
    const filter = { dateFrom: this.dateFrom, dateTo: this.dateTo, includeDraft: this.includeDraft };
    this.loading = true;

    const done = () => (this.loading = false);
    const fail = () => { this.toast.error('Failed to build the report.'); this.loading = false; };

    switch (this.active) {
      case 'trial-balance':
        this.service.getTrialBalance(filter).subscribe({ next: (r) => { this.trialBalance = r; done(); }, error: fail });
        break;
      case 'profit-and-loss':
        this.service.getProfitAndLoss(filter).subscribe({ next: (r) => { this.financial = r; done(); }, error: fail });
        break;
      case 'balance-sheet':
        this.service.getBalanceSheet(filter).subscribe({ next: (r) => { this.financial = r; done(); }, error: fail });
        break;
      case 'aged-receivable':
        this.service.getAgedBalance('customer', this.dateTo).subscribe({ next: (r) => { this.aged = r; done(); }, error: fail });
        break;
      case 'aged-payable':
        this.service.getAgedBalance('supplier', this.dateTo).subscribe({ next: (r) => { this.aged = r; done(); }, error: fail });
        break;
      case 'tax':
        this.service.getTaxReport(filter).subscribe({ next: (r) => { this.taxRows = r; done(); }, error: fail });
        break;
    }
  }

  get isFinancial() {
    return this.active === 'profit-and-loss' || this.active === 'balance-sheet';
  }

  get isAged() {
    return this.active === 'aged-receivable' || this.active === 'aged-payable';
  }

  get trialTotals() {
    return {
      debit: this.trialBalance.reduce((s, r) => s + r.totalDebit, 0),
      credit: this.trialBalance.reduce((s, r) => s + r.totalCredit, 0),
    };
  }

  get agedTotals() {
    return this.aged.reduce(
      (acc, r) => ({
        notDue: acc.notDue + r.notDue,
        b30: acc.b30 + r.bucket0To30,
        b60: acc.b60 + r.bucket31To60,
        b90: acc.b90 + r.bucket61To90,
        b90p: acc.b90p + r.bucket90Plus,
        total: acc.total + r.total,
      }),
      { notDue: 0, b30: 0, b60: 0, b90: 0, b90p: 0, total: 0 }
    );
  }

  get taxTotals() {
    return {
      base: this.taxRows.reduce((s, r) => s + r.netBase, 0),
      tax: this.taxRows.reduce((s, r) => s + r.taxAmount, 0),
    };
  }
}
