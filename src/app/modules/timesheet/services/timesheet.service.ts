import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { TimesheetEntry } from '../data/timesheet.mock';

export interface WeeklyTimesheetLine {
  customer: string;
  project: string;
  taskDescription: string;
  billable: boolean;
  ratePerHour: number;
  status: string;
  /** Seven values, Monday through Sunday. */
  hours: number[];
  locked: boolean;
  totalHours?: number;
}

export interface WeeklyTimesheet {
  employeeId: number;
  weekStart: string;
  lines: WeeklyTimesheetLine[];
}

@Injectable({ providedIn: 'root' })
export class TimesheetService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/timesheet/entries`;

  getAll() {
    return this.http.get<TimesheetEntry[]>(this.baseUrl);
  }

  create(entry: Partial<TimesheetEntry>) {
    return this.http.post<TimesheetEntry>(this.baseUrl, entry);
  }

  update(id: number, entry: TimesheetEntry) {
    return this.http.put<void>(`${this.baseUrl}/${id}`, entry);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  markInvoiced(ids: number[], invoiceNo: string) {
    return this.http.post<void>(`${this.baseUrl}/mark-invoiced`, { ids, invoiceNo });
  }

  getWeek(employeeId: number, weekStart: string) {
    return this.http.get<WeeklyTimesheet>(`${this.baseUrl}/week`, { params: { employeeId, weekStart } });
  }

  saveWeek(payload: { employeeId: number; weekStart: string; status: string; lines: WeeklyTimesheetLine[] }) {
    return this.http.post<WeeklyTimesheet>(`${this.baseUrl}/week`, payload);
  }
}
