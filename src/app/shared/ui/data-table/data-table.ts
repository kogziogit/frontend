import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'badge' | 'currency' | 'date' | 'link' | 'actions' | 'workflow' | 'invoice-actions' | 'invoice-row-actions';
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            @for (col of columns; track col.key) {
              <th>{{ col.label }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows; track row.id) {
            <tr>
              @for (col of columns; track col.key) {
                <td (click)="col.type !== 'actions' && rowClick.emit(row)">
                  @switch (col.type) {
                    @case ('badge') {
                      <span class="badge" [class]="'badge--' + (row[col.key] | lowercase)">{{ row[col.key] }}</span>
                    }
                    @case ('currency') {
                      <span>{{ row[col.key] | number: '1.2-2' }}</span>
                    }
                    @case ('date') {
                      <span>{{ row[col.key] | date: 'mediumDate' }}</span>
                    }
                    @case ('link') {
                      <a class="row-link">{{ row[col.key] }}</a>
                    }
                    @case ('actions') {
                      <div class="row-actions">
                        <button type="button" class="icon-btn" title="Edit" (click)="$event.stopPropagation(); edit.emit(row)">
                          <span class="material-symbols-outlined">edit</span>
                        </button>
                        <button type="button" class="icon-btn icon-btn--danger" title="Delete" (click)="$event.stopPropagation(); delete.emit(row)">
                          <span class="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    }
                    @case ('workflow') {
                      <div class="row-actions">
                        @if ((row.approvalStatus ?? row.status) === 'Submitted' || (row.approvalStatus ?? row.status) === 'Pending') {
                          <button type="button" class="icon-btn icon-btn--success" title="Approve" (click)="$event.stopPropagation(); approve.emit(row)">
                            <span class="material-symbols-outlined">check</span>
                          </button>
                          <button type="button" class="icon-btn icon-btn--danger" title="Refuse" (click)="$event.stopPropagation(); refuse.emit(row)">
                            <span class="material-symbols-outlined">close</span>
                          </button>
                        }
                      </div>
                    }
                    @case ('invoice-actions') {
                      <div class="row-actions">
                        <button type="button" class="icon-btn" title="Download PDF" (click)="$event.stopPropagation(); pdf.emit(row)">
                          <span class="material-symbols-outlined">picture_as_pdf</span>
                        </button>
                      </div>
                    }
                    @case ('invoice-row-actions') {
                      <div class="row-actions">
                        <button type="button" class="icon-btn" title="Edit invoice template" (click)="$event.stopPropagation(); template.emit(row)">
                          <span class="material-symbols-outlined">edit_note</span>
                        </button>
                        <button type="button" class="icon-btn" title="Download PDF" (click)="$event.stopPropagation(); pdf.emit(row)">
                          <span class="material-symbols-outlined">picture_as_pdf</span>
                        </button>
                        <button type="button" class="icon-btn" title="View in General Ledger" (click)="$event.stopPropagation(); ledger.emit(row)">
                          <span class="material-symbols-outlined">account_balance</span>
                        </button>
                      </div>
                    }
                    @default {
                      <span>{{ row[col.key] }}</span>
                    }
                  }
                </td>
              }
            </tr>
          } @empty {
            <tr>
              <td [attr.colspan]="columns.length" class="empty-cell">No records found.</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styleUrl: './data-table.scss',
})
export class DataTable {
  @Input() columns: TableColumn[] = [];
  @Input() rows: any[] = [];
  @Output() rowClick = new EventEmitter<any>();
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() approve = new EventEmitter<any>();
  @Output() refuse = new EventEmitter<any>();
  @Output() pdf = new EventEmitter<any>();
  @Output() template = new EventEmitter<any>();
  @Output() ledger = new EventEmitter<any>();
}
