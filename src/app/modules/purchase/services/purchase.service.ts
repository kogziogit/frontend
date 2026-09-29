import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { PurchaseOrder } from '../data/purchase-orders.mock';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/purchase/purchaseorders`;

  getAll() {
    return this.http.get<PurchaseOrder[]>(this.baseUrl);
  }

  create(order: Partial<PurchaseOrder>) {
    return this.http.post<PurchaseOrder>(this.baseUrl, order);
  }

  update(id: number, order: PurchaseOrder) {
    return this.http.put<void>(`${this.baseUrl}/${id}`, order);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
