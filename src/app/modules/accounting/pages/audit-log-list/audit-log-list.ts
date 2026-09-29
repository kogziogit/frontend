import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DataTable, TableColumn } from '../../../../shared/ui/data-table/data-table';
import { environment } from '../../../../../environments/environment';

interface AuditLog {
  id: number;
  module: string;
  entityName: string;
  entityId: number;
  action: string;
  summary: string;
  performedAt: string;
}

@Component({
  selector: 'app-audit-log-list',
  standalone: true,
  imports: [CommonModule, DataTable],
  template: `
    <h2 class="title">Audit Log</h2>
    <p class="subtitle">Recent create/update/delete activity across Accounting and Assets.</p>
    @if (loading) {
      <p>Loading audit log…</p>
    } @else if (error) {
      <p class="error">{{ error }}</p>
    } @else {
      <app-data-table [columns]="columns" [rows]="rows" />
    }
  `,
  styles: [`
    .title { color: #292934; font-size: 18px; margin: 0 0 4px; }
    .subtitle { color: #6b6b76; font-size: 13px; margin: 0 0 16px; }
    .error { color: #c0392b; }
  `],
})
export class AuditLogList implements OnInit {
  private http = inject(HttpClient);

  columns: TableColumn[] = [
    { key: 'performedAt', label: 'When', type: 'date' },
    { key: 'module', label: 'Module', type: 'badge' },
    { key: 'entityName', label: 'Entity' },
    { key: 'entityId', label: 'ID' },
    { key: 'action', label: 'Action', type: 'badge' },
    { key: 'summary', label: 'Summary' },
  ];

  rows: AuditLog[] = [];
  loading = true;
  error = '';

  ngOnInit() {
    this.http.get<AuditLog[]>(`${environment.apiBaseUrl}/audit/logs`).subscribe({
      next: (logs) => {
        this.rows = [...logs].sort((a, b) => b.performedAt.localeCompare(a.performedAt));
        this.loading = false;
      },
      error: () => { this.error = 'Failed to load the audit log.'; this.loading = false; },
    });
  }
}
