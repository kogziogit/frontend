import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Invoice } from '../data/invoices.mock';
import { Customer } from '../data/customers.mock';

@Injectable({ providedIn: 'root' })
export class AccountingService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/accounting/invoices`;

  getAll() {
    return this.http.get<Invoice[]>(this.baseUrl);
  }

  create(invoice: Partial<Invoice>) {
    return this.http.post<Invoice>(this.baseUrl, invoice);
  }

  update(id: number, invoice: Invoice) {
    return this.http.put<void>(`${this.baseUrl}/${id}`, invoice);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getCustomers() { return this.http.get<Customer[]>(`${environment.apiBaseUrl}/accounting/customers`); }
  createCustomer(customer: Partial<Customer>) { return this.http.post<Customer>(`${environment.apiBaseUrl}/accounting/customers`, customer); }
  updateCustomer(id: number, customer: Customer) { return this.http.put<void>(`${environment.apiBaseUrl}/accounting/customers/${id}`, customer); }
  deleteCustomer(id: number) { return this.http.delete<void>(`${environment.apiBaseUrl}/accounting/customers/${id}`); }
}
