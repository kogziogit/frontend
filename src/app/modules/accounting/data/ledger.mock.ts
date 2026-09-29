export interface ChartOfAccount {
  id: number;
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  isActive: boolean;
}

export interface JournalEntryLine {
  id?: number;
  accountId: number;
  accountCode?: string;
  accountName?: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntry {
  id: number;
  entryNo: string;
  entryDate: string;
  description: string;
  sourceModule: string;
  sourceReference?: string | null;
  status: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
}

export interface LedgerLine {
  entryDate: string;
  entryNo: string;
  description: string;
  sourceModule: string;
  sourceReference?: string | null;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface TrialBalanceRow {
  accountId: number;
  code: string;
  name: string;
  type: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}
