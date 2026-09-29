import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ChartOfAccount, JournalEntry, LedgerLine, TrialBalanceRow } from '../data/ledger.mock';

@Injectable({ providedIn: 'root' })
export class LedgerService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  getAccounts() {
    return this.http.get<ChartOfAccount[]>(`${this.base}/accounting/chartofaccounts`);
  }

  createAccount(account: Partial<ChartOfAccount>) {
    return this.http.post<ChartOfAccount>(`${this.base}/accounting/chartofaccounts`, account);
  }

  updateAccount(id: number, account: ChartOfAccount) {
    return this.http.put<void>(`${this.base}/accounting/chartofaccounts/${id}`, account);
  }

  getJournalEntries() {
    return this.http.get<JournalEntry[]>(`${this.base}/accounting/journalentries`);
  }

  createJournalEntry(entry: Partial<JournalEntry>) {
    return this.http.post<JournalEntry>(`${this.base}/accounting/journalentries`, entry);
  }

  getLedger(accountId: number) {
    return this.http.get<LedgerLine[]>(`${this.base}/accounting/journalentries/ledger/${accountId}`);
  }

  getTrialBalance() {
    return this.http.get<TrialBalanceRow[]>(`${this.base}/accounting/journalentries/trial-balance`);
  }
}
