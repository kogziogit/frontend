import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export type MoveType = 'entry' | 'out_invoice' | 'out_refund' | 'in_invoice' | 'in_refund';
export type MoveState = 'draft' | 'posted' | 'cancel';
export type PaymentState = 'not_paid' | 'partial' | 'paid' | 'reversed';

export interface AccountMoveLine {
  id: number;
  accountId: number;
  accountCode?: string;
  accountName?: string;
  partnerId?: number | null;
  name?: string | null;
  displayType: 'product' | 'tax' | 'payment_term' | 'entry';
  sortOrder: number;
  debit: number;
  credit: number;
  amountCurrency: number;
  quantity: number;
  priceUnit: number;
  discount: number;
  taxIds: number[];
  hsnSac?: string | null;
  originTaxId?: number | null;
  dateMaturity?: string | null;
  amountResidual: number;
  amountResidualCurrency: number;
  reconciled: boolean;
  balance: number;
}

export interface AccountMove {
  id: number;
  name: string;
  invoiceNumber?: string | null;
  journalId: number;
  journalCode?: string;
  journalName?: string;
  moveType: MoveType;
  state: MoveState;
  partnerId?: number | null;
  partnerName?: string | null;
  date: string;
  invoiceDate?: string | null;
  dueDate?: string | null;
  reference?: string | null;
  narration?: string | null;
  currencyCode: string;
  exchangeRate: number;
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
  amountResidual: number;
  amountPaid: number;
  paymentState: PaymentState;
  reversedMoveId?: number | null;
  createdAtUtc: string;
  postedAtUtc?: string | null;
  lines: AccountMoveLine[];
}

export interface SaveMoveLineRequest {
  accountId?: number | null;
  name?: string | null;
  quantity: number;
  priceUnit: number;
  discount: number;
  taxIds: number[];
  hsnSac?: string | null;
  debit?: number;
  credit?: number;
}

export interface SaveMoveRequest {
  journalId: number;
  moveType: MoveType;
  invoiceNumber?: string | null;
  partnerId?: number | null;
  partnerName?: string | null;
  date: string;
  invoiceDate?: string | null;
  dueDate?: string | null;
  reference?: string | null;
  narration?: string | null;
  currencyCode: string;
  lines: SaveMoveLineRequest[];
}

export interface AccountJournal {
  id: number;
  code: string;
  name: string;
  type: 'sale' | 'purchase' | 'bank' | 'cash' | 'general';
  defaultAccountId?: number | null;
  partnerAccountId?: number | null;
  sequencePrefix: string;
  nextSequence: number;
  isActive: boolean;
}

export interface AccountTax {
  id: number;
  name: string;
  typeTaxUse: 'sale' | 'purchase' | 'none';
  amountType: 'percent' | 'fixed';
  amount: number;
  priceInclude: boolean;
  taxAccountId?: number | null;
  refundAccountId?: number | null;
  sequence: number;
  isActive: boolean;
}

export interface AccountPayment {
  id: number;
  name: string;
  journalId: number;
  journalName?: string;
  paymentType: 'inbound' | 'outbound';
  partnerType: 'customer' | 'supplier';
  partnerId?: number | null;
  partnerName?: string | null;
  amount: number;
  currencyCode: string;
  paymentDate: string;
  paymentMethod?: string | null;
  reference?: string | null;
  state: MoveState;
  moveId?: number | null;
  amountUnreconciled: number;
}

export interface OutstandingLine {
  moveLineId: number;
  moveId: number;
  moveName: string;
  moveType: MoveType;
  partnerId?: number | null;
  partnerName?: string | null;
  date: string;
  dueDate?: string | null;
  amount: number;
  amountResidual: number;
  currencyCode: string;
}

export interface AccountSettings {
  id: number;
  companyCurrency: string;
  fiscalYearLockDate?: string | null;
  fiscalYearEndMonth: number;
  fiscalYearEndDay: number;
  defaultReceivableAccountId?: number | null;
  defaultPayableAccountId?: number | null;
  defaultIncomeAccountId?: number | null;
  defaultExpenseAccountId?: number | null;
  currencyGainAccountId?: number | null;
  currencyLossAccountId?: number | null;
}

export interface CurrencyRate {
  id: number;
  currencyCode: string;
  rateDate: string;
  rate: number;
}

export interface TrialBalanceRow {
  accountId: number;
  code: string;
  name: string;
  type: string;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export interface LedgerLine {
  entryDate: string;
  entryNo: string;
  description?: string;
  sourceReference?: string;
  partnerName?: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface FinancialReportLine {
  section: string;
  accountId?: number | null;
  code?: string | null;
  name: string;
  amount: number;
  level: number;
  isTotal: boolean;
}

export interface AgedBalanceRow {
  partnerId?: number | null;
  partnerName: string;
  notDue: number;
  bucket0To30: number;
  bucket31To60: number;
  bucket61To90: number;
  bucket90Plus: number;
  total: number;
}

export interface TaxReportRow {
  taxId: number;
  taxName: string;
  typeTaxUse: string;
  netBase: number;
  taxAmount: number;
}

export interface ReportFilter {
  dateFrom?: string | null;
  dateTo?: string | null;
  includeDraft?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AccountingCoreService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/accounting`;

  // ---------------------------------------------------------------- moves

  getMoves(moveType?: MoveType) {
    const params = moveType ? new HttpParams().set('moveType', moveType) : undefined;
    return this.http.get<AccountMove[]>(`${this.base}/moves`, { params });
  }

  getMove(id: number) {
    return this.http.get<AccountMove>(`${this.base}/moves/${id}`);
  }

  createMove(request: SaveMoveRequest) {
    return this.http.post<AccountMove>(`${this.base}/moves`, request);
  }

  updateMove(id: number, request: SaveMoveRequest) {
    return this.http.put<AccountMove>(`${this.base}/moves/${id}`, request);
  }

  postMove(id: number) {
    return this.http.post<AccountMove>(`${this.base}/moves/${id}/post`, {});
  }

  resetMoveToDraft(id: number) {
    return this.http.post<AccountMove>(`${this.base}/moves/${id}/reset-to-draft`, {});
  }

  cancelMove(id: number) {
    return this.http.post<AccountMove>(`${this.base}/moves/${id}/cancel`, {});
  }

  reverseMove(id: number, body: { date?: string; reason?: string; reconcile: boolean }) {
    return this.http.post<AccountMove>(`${this.base}/moves/${id}/reverse`, body);
  }

  deleteMove(id: number) {
    return this.http.delete<void>(`${this.base}/moves/${id}`);
  }

  // ---------------------------------------------------------------- payments

  getPayments() {
    return this.http.get<AccountPayment[]>(`${this.base}/payments`);
  }

  getOutstanding(partnerType: 'customer' | 'supplier', partnerId?: number) {
    let params = new HttpParams().set('partnerType', partnerType);
    if (partnerId) params = params.set('partnerId', partnerId);
    return this.http.get<OutstandingLine[]>(`${this.base}/payments/outstanding`, { params });
  }

  registerPayment(request: Partial<AccountPayment> & { moveIds: number[]; autoPost: boolean }) {
    return this.http.post<AccountPayment>(`${this.base}/payments`, request);
  }

  deletePayment(id: number) {
    return this.http.delete<void>(`${this.base}/payments/${id}`);
  }

  reconcile(moveLineIds: number[]) {
    return this.http.post<void>(`${this.base}/payments/reconcile`, { moveLineIds });
  }

  unreconcile(moveLineId: number) {
    return this.http.post<void>(`${this.base}/payments/unreconcile/${moveLineId}`, {});
  }

  // ---------------------------------------------------------------- config

  getJournals() {
    return this.http.get<AccountJournal[]>(`${this.base}/config/journals`);
  }

  saveJournal(id: number | null, dto: Partial<AccountJournal>) {
    return id
      ? this.http.put<AccountJournal>(`${this.base}/config/journals/${id}`, dto)
      : this.http.post<AccountJournal>(`${this.base}/config/journals`, dto);
  }

  deleteJournal(id: number) {
    return this.http.delete<void>(`${this.base}/config/journals/${id}`);
  }

  getTaxes() {
    return this.http.get<AccountTax[]>(`${this.base}/config/taxes`);
  }

  saveTax(id: number | null, dto: Partial<AccountTax>) {
    return id
      ? this.http.put<AccountTax>(`${this.base}/config/taxes/${id}`, dto)
      : this.http.post<AccountTax>(`${this.base}/config/taxes`, dto);
  }

  deleteTax(id: number) {
    return this.http.delete<void>(`${this.base}/config/taxes/${id}`);
  }

  getSettings() {
    return this.http.get<AccountSettings>(`${this.base}/config/settings`);
  }

  saveSettings(dto: AccountSettings) {
    return this.http.put<AccountSettings>(`${this.base}/config/settings`, dto);
  }

  getCurrencyRates() {
    return this.http.get<CurrencyRate[]>(`${this.base}/config/currency-rates`);
  }

  saveCurrencyRate(dto: Partial<CurrencyRate>) {
    return this.http.post<CurrencyRate>(`${this.base}/config/currency-rates`, dto);
  }

  deleteCurrencyRate(id: number) {
    return this.http.delete<void>(`${this.base}/config/currency-rates/${id}`);
  }

  // ---------------------------------------------------------------- reports

  getTrialBalance(filter: ReportFilter = {}) {
    return this.http.get<TrialBalanceRow[]>(`${this.base}/reports/trial-balance`, { params: this.toParams(filter) });
  }

  getLedger(accountId: number, filter: ReportFilter = {}) {
    return this.http.get<LedgerLine[]>(`${this.base}/reports/ledger/${accountId}`, { params: this.toParams(filter) });
  }

  getProfitAndLoss(filter: ReportFilter = {}) {
    return this.http.get<FinancialReportLine[]>(`${this.base}/reports/profit-and-loss`, { params: this.toParams(filter) });
  }

  getBalanceSheet(filter: ReportFilter = {}) {
    return this.http.get<FinancialReportLine[]>(`${this.base}/reports/balance-sheet`, { params: this.toParams(filter) });
  }

  getAgedBalance(partnerType: 'customer' | 'supplier', asOf?: string) {
    let params = new HttpParams().set('partnerType', partnerType);
    if (asOf) params = params.set('asOf', asOf);
    return this.http.get<AgedBalanceRow[]>(`${this.base}/reports/aged-balance`, { params });
  }

  getTaxReport(filter: ReportFilter = {}) {
    return this.http.get<TaxReportRow[]>(`${this.base}/reports/tax`, { params: this.toParams(filter) });
  }

  private toParams(filter: ReportFilter) {
    let params = new HttpParams();
    if (filter.dateFrom) params = params.set('dateFrom', filter.dateFrom);
    if (filter.dateTo) params = params.set('dateTo', filter.dateTo);
    if (filter.includeDraft) params = params.set('includeDraft', true);
    return params;
  }
}
