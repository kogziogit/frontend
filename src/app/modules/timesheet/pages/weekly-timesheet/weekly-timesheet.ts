import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { TimesheetService, WeeklyTimesheetLine } from '../../services/timesheet.service';
import { HrService } from '../../../hr/services/hr.service';
import { AccountingService } from '../../../accounting/services/accounting.service';
import { Employee } from '../../../hr/data/employees.mock';
import { Customer } from '../../../accounting/data/customers.mock';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

@Component({
  selector: 'app-weekly-timesheet',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeader],
  template: `
    <app-page-header title="Daily Entry" subtitle="Fill your hours day by day for the week" [searchable]="false" />

    <section class="toolbar">
      <label>
        Employee
        <select [(ngModel)]="employeeId" (ngModelChange)="loadWeek()">
          @for (employee of employees; track employee.id) {
            <option [ngValue]="employee.id">{{ employee.name }}</option>
          }
        </select>
      </label>

      <div class="week-picker">
        <button type="button" class="icon-btn" title="Previous week" (click)="shiftWeek(-7)">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <span class="week-label">{{ weekLabel }}</span>
        <button type="button" class="icon-btn" title="Next week" (click)="shiftWeek(7)">
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
        <button type="button" class="btn btn--ghost" (click)="goToThisWeek()">This week</button>
      </div>

      <div class="toolbar__actions">
        <button type="button" class="btn btn--ghost" (click)="addLine()">Add Line</button>
        <button type="button" class="btn" (click)="save('Draft')">Save Draft</button>
        <button type="button" class="btn btn--primary" (click)="save('Submitted')">Submit Week</button>
      </div>
    </section>

    @if (loading) {
      <p>Loading timesheet…</p>
    } @else if (error) {
      <p class="error">{{ error }}</p>
    } @else {
      <div class="grid-wrap">
        <table class="grid">
          <thead>
            <tr>
              <th class="col-customer">Customer</th>
              <th class="col-project">Project</th>
              <th class="col-task">Task</th>
              <th class="col-rate">Rate</th>
              <th class="col-billable">Billable</th>
              @for (day of days; track day.iso) {
                <th class="col-day" [class.col-day--weekend]="day.weekend">
                  <span class="day-name">{{ day.label }}</span>
                  <span class="day-date">{{ day.short }}</span>
                </th>
              }
              <th class="col-total">Total</th>
              <th class="col-actions"></th>
            </tr>
          </thead>
          <tbody>
            @for (line of lines; track $index; let rowIndex = $index) {
              <tr [class.locked]="line.locked">
                <td>
                  <select [(ngModel)]="line.customer" [disabled]="line.locked">
                    <option value="">—</option>
                    @for (customer of customers; track customer.id) {
                      <option [ngValue]="customer.name">{{ customer.name }}</option>
                    }
                  </select>
                </td>
                <td><input type="text" [(ngModel)]="line.project" [disabled]="line.locked" placeholder="Project" /></td>
                <td><input type="text" [(ngModel)]="line.taskDescription" [disabled]="line.locked" placeholder="What did you work on?" /></td>
                <td><input type="number" min="0" step="0.01" [(ngModel)]="line.ratePerHour" [disabled]="line.locked" /></td>
                <td class="center"><input type="checkbox" [(ngModel)]="line.billable" [disabled]="line.locked" /></td>
                @for (day of days; track day.iso; let dayIndex = $index) {
                  <td class="center" [class.col-day--weekend]="day.weekend">
                    <input
                      type="number"
                      class="hours"
                      min="0"
                      max="24"
                      step="0.25"
                      [disabled]="line.locked"
                      [ngModel]="line.hours[dayIndex]"
                      (ngModelChange)="setHours(rowIndex, dayIndex, $event)"
                    />
                  </td>
                }
                <td class="center strong">{{ rowTotal(line) | number: '1.2-2' }}</td>
                <td class="center">
                  @if (!line.locked) {
                    <button type="button" class="icon-btn icon-btn--danger" title="Remove line" (click)="removeLine(rowIndex)">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  } @else {
                    <span class="material-symbols-outlined lock" title="Invoiced">lock</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td class="empty-cell" [attr.colspan]="12">No lines yet. Use “Add Line” to start logging hours.</td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" class="strong">Daily total</td>
              @for (day of days; track day.iso; let dayIndex = $index) {
                <td class="center strong" [class.col-day--weekend]="day.weekend" [class.over]="dayTotal(dayIndex) > 24">
                  {{ dayTotal(dayIndex) | number: '1.2-2' }}
                </td>
              }
              <td class="center strong">{{ weekTotal | number: '1.2-2' }}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p class="hint">Billable value for this week: <strong>{{ billableAmount | number: '1.2-2' }}</strong></p>
    }
  `,
  styles: [`
    .error { color: #c0392b; }
    .toolbar { align-items: flex-end; background: #fff; border: 1px solid #e2e2e8; border-radius: 8px; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; margin-bottom: 16px; padding: 14px 16px; }
    .toolbar label { color: #6b6b76; display: flex; flex-direction: column; font-size: 12px; gap: 4px; }
    .toolbar select, .toolbar input { border: 1px solid #dedee5; border-radius: 5px; font: inherit; font-size: 13px; padding: 7px 10px; }
    .toolbar__actions { display: flex; gap: 8px; }
    .week-picker { align-items: center; display: flex; gap: 6px; }
    .week-label { font-size: 13px; font-weight: 600; min-width: 210px; text-align: center; }
    .btn { background: #f2f2f6; border: 1px solid #dedee5; border-radius: 6px; cursor: pointer; font: inherit; font-size: 12px; padding: 8px 12px; }
    .btn--primary { background: #464feb; border-color: #464feb; color: #fff; }
    .btn--ghost { background: #fff; }
    .icon-btn { background: none; border: 0; border-radius: 4px; color: #6b6b76; cursor: pointer; display: inline-flex; padding: 4px; }
    .icon-btn:hover { background: #f0f0f4; }
    .icon-btn--danger:hover { color: #c0392b; }
    .lock { color: #b0b0bb; font-size: 18px; }
    .grid-wrap { background: #fff; border: 1px solid #e2e2e8; border-radius: 8px; overflow-x: auto; }
    .grid { border-collapse: collapse; min-width: 1250px; table-layout: fixed; width: 100%; }
    .grid th, .grid td { border-bottom: 1px solid #ececf1; box-sizing: border-box; padding: 6px 8px; text-align: left; }
    .grid th { background: #fafafc; color: #6b6b76; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .grid tfoot td { background: #fafafc; border-bottom: 0; font-size: 12px; }
    .grid input, .grid select { border: 1px solid #dedee5; border-radius: 5px; box-sizing: border-box; font: inherit; font-size: 13px; min-width: 0; padding: 6px 8px; width: 100%; }
    .grid input[type='checkbox'] { width: auto; }
    .grid input:disabled, .grid select:disabled { background: #f6f6f9; color: #8a8a96; }
    .col-customer { width: 155px; }
    .col-project { width: 180px; }
    .col-task { width: 235px; }
    .col-day { text-align: center; width: 78px; }
    .col-day--weekend { background: #f7f7fb; }
    .col-rate { width: 92px; }
    .col-billable, .col-actions { width: 64px; }
    .col-total { text-align: center; width: 80px; }
    .day-name { display: block; }
    .day-date { color: #a0a0ab; display: block; font-size: 10px; font-weight: 400; }
    .center { text-align: center; }
    .center input.hours { text-align: center; }
    .strong { font-weight: 600; }
    .over { color: #c0392b; }
    .locked { background: #fbfbfd; }
    .empty-cell { color: #8a8a96; padding: 24px; text-align: center; }
    .hint { color: #6b6b76; font-size: 12px; margin-top: 12px; }
  `],
})
export class WeeklyTimesheet implements OnInit {
  private timesheetService = inject(TimesheetService);
  private hrService = inject(HrService);
  private accountingService = inject(AccountingService);
  private toast = inject(ToastService);

  employees: Employee[] = [];
  customers: Customer[] = [];
  employeeId = 0;
  weekStart = this.toIso(this.mondayOf(new Date()));
  lines: WeeklyTimesheetLine[] = [];
  loading = true;
  error = '';

  ngOnInit() {
    this.accountingService.getCustomers().subscribe((customers) => {
      this.customers = customers.filter((c) => c.status === 'Active');
    });
    this.hrService.getAll().subscribe({
      next: (employees) => {
        this.employees = employees.filter((e) => e.status === 'Active');
        this.employeeId = this.employees[0]?.id ?? 0;
        this.loadWeek();
      },
      error: () => {
        this.error = 'Failed to load employees. Is the API running?';
        this.loading = false;
      },
    });
  }

  get days() {
    const start = this.toDate(this.weekStart);
    return DAY_LABELS.map((label, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        label,
        iso: this.toIso(date),
        short: `${date.getDate()}/${date.getMonth() + 1}`,
        weekend: index >= 5,
      };
    });
  }

  get weekLabel() {
    const days = this.days;
    const format = (iso: string) => this.toDate(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    return `${format(days[0].iso)} – ${format(days[6].iso)}`;
  }

  get weekTotal() {
    return this.lines.reduce((sum, line) => sum + this.rowTotal(line), 0);
  }

  get billableAmount() {
    return this.lines
      .filter((line) => line.billable)
      .reduce((sum, line) => sum + this.rowTotal(line) * (Number(line.ratePerHour) || 0), 0);
  }

  loadWeek() {
    if (!this.employeeId) {
      this.lines = [];
      this.loading = false;
      return;
    }
    this.loading = true;
    this.error = '';
    this.timesheetService.getWeek(this.employeeId, this.weekStart).subscribe({
      next: (week) => {
        this.lines = week.lines.map((line) => ({ ...line, hours: this.normalizeHours(line.hours) }));
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load the weekly timesheet.';
        this.loading = false;
      },
    });
  }

  shiftWeek(days: number) {
    const date = this.toDate(this.weekStart);
    date.setDate(date.getDate() + days);
    this.weekStart = this.toIso(date);
    this.loadWeek();
  }

  goToThisWeek() {
    this.weekStart = this.toIso(this.mondayOf(new Date()));
    this.loadWeek();
  }

  addLine() {
    const last = this.lines[this.lines.length - 1];
    this.lines = [
      ...this.lines,
      {
        customer: last?.customer ?? this.customers[0]?.name ?? '',
        project: '',
        taskDescription: '',
        billable: true,
        ratePerHour: last?.ratePerHour ?? 0,
        status: 'Draft',
        hours: [0, 0, 0, 0, 0, 0, 0],
        locked: false,
      },
    ];
  }

  removeLine(index: number) {
    this.lines = this.lines.filter((_, i) => i !== index);
  }

  setHours(rowIndex: number, dayIndex: number, value: unknown) {
    const hours = Math.min(Math.max(Number(value) || 0, 0), 24);
    this.lines[rowIndex].hours[dayIndex] = hours;
  }

  rowTotal(line: WeeklyTimesheetLine) {
    return line.hours.reduce((sum, hours) => sum + (Number(hours) || 0), 0);
  }

  dayTotal(dayIndex: number) {
    return this.lines.reduce((sum, line) => sum + (Number(line.hours[dayIndex]) || 0), 0);
  }

  save(status: 'Draft' | 'Submitted') {
    const editable = this.lines.filter((line) => !line.locked);
    const filled = editable.filter((line) => this.rowTotal(line) > 0);

    if (filled.some((line) => !line.customer || !line.project.trim() || !line.taskDescription.trim())) {
      this.toast.error('Customer, project and task are required on every line with hours.');
      return;
    }
    if (this.days.some((_, index) => this.dayTotal(index) > 24)) {
      this.toast.error('A day cannot exceed 24 hours.');
      return;
    }
    if (status === 'Submitted' && !filled.length) {
      this.toast.error('Log at least one hour before submitting the week.');
      return;
    }

    this.timesheetService
      .saveWeek({ employeeId: this.employeeId, weekStart: this.weekStart, status, lines: editable })
      .subscribe({
        next: (week) => {
          this.lines = week.lines.map((line) => ({ ...line, hours: this.normalizeHours(line.hours) }));
          this.toast.success(status === 'Submitted' ? 'Week submitted for approval.' : 'Timesheet saved.');
        },
        error: () => this.toast.error('Failed to save the timesheet.'),
      });
  }

  private normalizeHours(hours: number[]) {
    return Array.from({ length: 7 }, (_, index) => Number(hours?.[index]) || 0);
  }

  private mondayOf(date: Date) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
    return copy;
  }

  private toDate(iso: string) {
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private toIso(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}
