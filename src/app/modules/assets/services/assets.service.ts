import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Asset } from '../data/assets.mock';

@Injectable({ providedIn: 'root' })
export class AssetsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/assets/assets`;

  getAll() {
    return this.http.get<Asset[]>(this.baseUrl);
  }

  create(asset: Partial<Asset>) {
    return this.http.post<Asset>(this.baseUrl, asset);
  }

  update(id: number, asset: Asset) {
    return this.http.put<void>(`${this.baseUrl}/${id}`, asset);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
