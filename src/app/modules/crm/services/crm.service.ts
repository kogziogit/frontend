import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Lead } from '../data/leads.mock';

export interface Activity {
  id: number;
  leadId: number;
  type: 'Call' | 'Email' | 'Meeting' | 'Note';
  subject: string;
  notes: string;
  dueDate: string;
  completedDate?: string | null;
  status: 'Planned' | 'Completed' | 'Cancelled';
  createdDate: string;
}

@Injectable({ providedIn: 'root' })
export class CrmService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/crm/leads`;

  getAll() {
    return this.http.get<Lead[]>(this.baseUrl);
  }
  
  getById(id: number) {
    return this.http.get<Lead>(`${this.baseUrl}/${id}`);
  }

  create(lead: Partial<Lead>) {
    return this.http.post<Lead>(this.baseUrl, lead);
  }

  update(id: number, lead: Lead) {
    return this.http.put<void>(`${this.baseUrl}/${id}`, lead);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getActivities(leadId?: number) {
    const url = `${environment.apiBaseUrl}/crm/activities`;
    return this.http.get<Activity[]>(leadId ? `${url}?leadId=${leadId}` : url);
  }

  createActivity(activity: Partial<Activity>) {
    return this.http.post<Activity>(`${environment.apiBaseUrl}/crm/activities`, activity);
  }

  updateActivity(id: number, activity: Activity) {
    return this.http.put<void>(`${environment.apiBaseUrl}/crm/activities/${id}`, activity);
  }

  deleteActivity(id: number) {
    return this.http.delete<void>(`${environment.apiBaseUrl}/crm/activities/${id}`);
  }
}
