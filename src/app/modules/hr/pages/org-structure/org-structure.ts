import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { DataTable, TableColumn } from '../../../../shared/ui/data-table/data-table';
import { EntityFormModal } from '../../../../shared/ui/entity-form-modal/entity-form-modal';
import { EntityFormField } from '../../../../shared/ui/entity-form-modal/entity-form-field';
import { HrmsService, Department, Designation } from '../../services/hrms.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-org-structure',
  standalone: true,
  imports: [CommonModule, DataTable, EntityFormModal],
  template: `
    <section class="panel">
      <div class="panel-header"><h2>Departments</h2><button class="btn" type="button" (click)="openCreateDepartment()">New Department</button></div>
      <app-data-table [columns]="departmentColumns" [rows]="departments" (edit)="openEditDepartment($event)" (delete)="onDeleteDepartment($event)" />
    </section>

    <section class="panel">
      <div class="panel-header"><h2>Designations</h2><button class="btn" type="button" (click)="openCreateDesignation()">New Designation</button></div>
      <app-data-table [columns]="designationColumns" [rows]="designations" (edit)="openEditDesignation($event)" (delete)="onDeleteDesignation($event)" />
    </section>

    @if (showDepartmentForm) {
      <app-entity-form-modal
        [title]="editingDepartment ? 'Edit Department' : 'New Department'"
        [fields]="departmentFields"
        [model]="editingDepartment"
        (save)="onSaveDepartment($event)"
        (cancel)="showDepartmentForm = false"
      />
    }
    @if (showDesignationForm) {
      <app-entity-form-modal
        [title]="editingDesignation ? 'Edit Designation' : 'New Designation'"
        [fields]="designationFields"
        [model]="editingDesignation"
        (save)="onSaveDesignation($event)"
        (cancel)="showDesignationForm = false"
      />
    }
  `,
  styles: [`
    .panel { background: #fff; border: 1px solid #e2e2e8; border-radius: 8px; margin-bottom: 16px; padding: 18px; }
    .panel-header { align-items: center; display: flex; justify-content: space-between; margin-bottom: 12px; }
    .panel-header h2 { color: #292934; font-size: 16px; margin: 0; }
    .btn { background: #464feb; border: 0; border-radius: 6px; color: #fff; cursor: pointer; font: inherit; font-size: 12px; padding: 8px 12px; }
  `],
})
export class OrgStructure implements OnInit {
  private hrmsService = inject(HrmsService);
  private toast = inject(ToastService);

  departmentColumns: TableColumn[] = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name', type: 'link' },
    { key: 'managerName', label: 'Manager' },
    { key: 'description', label: 'Description' },
    { key: 'actions', label: '', type: 'actions' },
  ];
  departmentFields: EntityFormField[] = [
    { key: 'code', label: 'Code', type: 'text', required: true },
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'managerName', label: 'Manager', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
  ];

  designationColumns: TableColumn[] = [
    { key: 'title', label: 'Title', type: 'link' },
    { key: 'department', label: 'Department' },
    { key: 'level', label: 'Level', type: 'badge' },
    { key: 'actions', label: '', type: 'actions' },
  ];
  designationFields: EntityFormField[] = [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'department', label: 'Department', type: 'text' },
    {
      key: 'level', label: 'Level', type: 'select', required: true,
      options: [
        { value: 'Junior', label: 'Junior' },
        { value: 'Mid', label: 'Mid' },
        { value: 'Senior', label: 'Senior' },
        { value: 'Lead', label: 'Lead' },
        { value: 'Manager', label: 'Manager' },
        { value: 'Director', label: 'Director' },
      ],
    },
  ];

  departments: Department[] = [];
  designations: Designation[] = [];
  showDepartmentForm = false;
  showDesignationForm = false;
  editingDepartment: Department | null = null;
  editingDesignation: Designation | null = null;

  ngOnInit() { this.loadData(); }

  loadData() {
    this.hrmsService.getDepartments().subscribe((data) => this.departments = data);
    this.hrmsService.getDesignations().subscribe((data) => this.designations = data);
  }

  openCreateDepartment() { this.editingDepartment = null; this.showDepartmentForm = true; }
  openEditDepartment(row: Department) { this.editingDepartment = row; this.showDepartmentForm = true; }
  onSaveDepartment(value: Record<string, unknown>) {
    const request: Observable<unknown> = this.editingDepartment
      ? this.hrmsService.updateDepartment(this.editingDepartment.id, { ...this.editingDepartment, ...value } as Department)
      : this.hrmsService.createDepartment(value);
    request.subscribe({
      next: () => { this.showDepartmentForm = false; this.toast.success('Department saved.'); this.loadData(); },
      error: () => this.toast.error('Failed to save the department.'),
    });
  }
  onDeleteDepartment(row: Department) {
    if (!confirm(`Delete department ${row.name}?`)) return;
    this.hrmsService.deleteDepartment(row.id).subscribe({
      next: () => { this.toast.success('Department deleted.'); this.loadData(); },
      error: () => this.toast.error('Failed to delete the department.'),
    });
  }

  openCreateDesignation() { this.editingDesignation = null; this.showDesignationForm = true; }
  openEditDesignation(row: Designation) { this.editingDesignation = row; this.showDesignationForm = true; }
  onSaveDesignation(value: Record<string, unknown>) {
    const request: Observable<unknown> = this.editingDesignation
      ? this.hrmsService.updateDesignation(this.editingDesignation.id, { ...this.editingDesignation, ...value } as Designation)
      : this.hrmsService.createDesignation(value);
    request.subscribe({
      next: () => { this.showDesignationForm = false; this.toast.success('Designation saved.'); this.loadData(); },
      error: () => this.toast.error('Failed to save the designation.'),
    });
  }
  onDeleteDesignation(row: Designation) {
    if (!confirm(`Delete designation ${row.title}?`)) return;
    this.hrmsService.deleteDesignation(row.id).subscribe({
      next: () => { this.toast.success('Designation deleted.'); this.loadData(); },
      error: () => this.toast.error('Failed to delete the designation.'),
    });
  }
}
