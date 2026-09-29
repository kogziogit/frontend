import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { SalesOrder } from '../data/orders.mock';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/sales/salesorders`;

  getAll() {
    return this.http.get<SalesOrder[]>(this.baseUrl);
  }

  create(order: Partial<SalesOrder>) {
    return this.http.post<SalesOrder>(this.baseUrl, order);
  }

  update(id: number, order: SalesOrder) {
    return this.http.put<void>(`${this.baseUrl}/${id}`, order);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
