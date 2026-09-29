import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ServiceCatalogItem {
  id: number;
  serviceDescription: string;
  hsnSac: string;
}

@Injectable({ providedIn: 'root' })
export class ServiceCatalogService {
  private http = inject(HttpClient);
  // Static description -> HSN/SAC lookup rarely changes, so cache the first response for the app session.
  private cache$?: Observable<ServiceCatalogItem[]>;

  getAll(): Observable<ServiceCatalogItem[]> {
    if (!this.cache$) {
      this.cache$ = this.http.get<ServiceCatalogItem[]>(`${environment.apiBaseUrl}/accounting/service-catalog`).pipe(shareReplay(1));
    }
    return this.cache$;
  }
}
