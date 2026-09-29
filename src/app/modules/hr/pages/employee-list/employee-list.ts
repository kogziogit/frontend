import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { DataTable, TableColumn } from '../../../../shared/ui/data-table/data-table';
import { EntityFormModal } from '../../../../shared/ui/entity-form-modal/entity-form-modal';
import { EntityFormField } from '../../../../shared/ui/entity-form-modal/entity-form-field';
import { Employee } from '../../data/employees.mock';
import { HrService } from '../../services/hr.service';
import { HrmsService } from '../../services/hrms.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { COUNTRIES } from '../../../../shared/data/countries';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, PageHeader, DataTable, EntityFormModal],
  template: `
    <app-page-header title="Employees" subtitle="Company directory" createLabel="New Employee" (search)="onSearch($event)" (create)="openCreate()" />
    @if (loading) {
      <p>Loading employees…</p>
    } @else if (error) {
      <p class="error">{{ error }}</p>
    } @else {
      <app-data-table [columns]="columns" [rows]="filteredRows" (edit)="openEdit($event)" (delete)="onDelete($event)" />
    }
    @if (showForm) {
      <app-entity-form-modal
        [title]="editingRow ? 'Edit Employee' : 'New Employee'"
        [fields]="fields"
        [model]="editingRow ?? { empId: nextEmployeeId() }"
        [wide]="true"
        (save)="onSave($event)"
        (cancel)="showForm = false"
      />
    }
  `,
  styles: [`.error { color: #c0392b; }`],
})
export class EmployeeList implements OnInit {
  private hrService = inject(HrService);
  private hrmsService = inject(HrmsService);
  private toast = inject(ToastService);

  columns: TableColumn[] = [
    { key: 'empId', label: 'Employee ID' },
    { key: 'name', label: 'Name', type: 'link' },
    { key: 'email', label: 'Work Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'department', label: 'Department' },
    { key: 'designation', label: 'Designation' },
    { key: 'lastWorkingDate', label: 'Last Working Date', type: 'date' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'actions', label: '', type: 'actions' },
  ];

  fields: EntityFormField[] = [
    { key: 'empId', label: 'Employee ID', type: 'text', required: true, tab: 'General' },
    { key: 'name', label: 'Name', type: 'text', required: true, tab: 'General' },
    { key: 'email', label: 'Work Email', type: 'email', required: true, tab: 'General' },
    { key: 'phone', label: 'Phone', type: 'text', required: true, tab: 'General' },
    { key: 'department', label: 'Department', type: 'select', required: true, options: [], tab: 'General' },
    { key: 'designation', label: 'Designation', type: 'select', required: true, options: [], tab: 'General' },
    { key: 'dateOfJoining', label: 'Date of Joining', type: 'date', required: true, tab: 'General' },
    { key: 'lastWorkingDate', label: 'Last Working Date', type: 'date', tab: 'General' },
    { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', tab: 'General' },
    { key: 'bloodGroup', label: 'Blood Group', type: 'select', tab: 'General', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((value) => ({ value, label: value })) },
    {
      key: 'employmentType', label: 'Employment Type', type: 'select', required: true,
      tab: 'General', options: [
        { value: 'Full-time', label: 'Full-time' },
        { value: 'Part-time', label: 'Part-time' },
        { value: 'Contract', label: 'Contract' },
        { value: 'Intern', label: 'Intern' },
      ],
    },
    { key: 'manager', label: 'Manager', type: 'select', options: [], tab: 'General' },
    { key: 'address', label: 'Address', type: 'text', tab: 'General' },
    { key: 'country', label: 'Country', type: 'select', tab: 'General', options: COUNTRIES.map((country) => ({ value: country, label: country })) },
    { key: 'emergencyContactName', label: 'Emergency Contact', type: 'text', tab: 'General' },
    { key: 'emergencyContactPhone', label: 'Emergency Phone', type: 'text', tab: 'General' },
    { key: 'notes', label: 'Employee Notes', type: 'text', tab: 'General' },
    { key: 'bankAccount', label: 'Bank Account', type: 'text', tab: 'Bank' },
    { key: 'bankName', label: 'Bank Name', type: 'text', tab: 'Bank' },
    { key: 'bankBranch', label: 'Branch', type: 'text', tab: 'Bank' },
    { key: 'accountType', label: 'Account Type', type: 'select', tab: 'Bank', options: [{ value: 'Savings', label: 'Savings' }, { value: 'Current', label: 'Current' }] },
    { key: 'ifscSwiftCode', label: 'IFSC / SWIFT Code', type: 'text', tab: 'Bank' },
    { key: 'iban', label: 'IBAN', type: 'text', tab: 'Bank' },
    { key: 'paymentMode', label: 'Payment Mode', type: 'select', tab: 'Bank', options: [{ value: 'Bank Transfer', label: 'Bank Transfer' }, { value: 'Cash', label: 'Cash' }, { value: 'Cheque', label: 'Cheque' }] },
    { key: 'highestQualification', label: 'Highest Qualification', type: 'text', tab: 'Education' },
    { key: 'institution', label: 'Institution / University', type: 'text', tab: 'Education' },
    { key: 'graduationYear', label: 'Graduation Year', type: 'number', tab: 'Education' },
    { key: 'percentage', label: 'Marks / Percentage', type: 'number', tab: 'Education' },
    { key: 'additionalQualification', label: 'Additional Qualification', type: 'text', tab: 'Education' },
    { key: 'additionalInstitution', label: 'Additional Institution', type: 'text', tab: 'Education' },
    { key: 'additionalGraduationYear', label: 'Additional Graduation Year', type: 'number', tab: 'Education' },
    { key: 'additionalPercentage', label: 'Additional Marks / Percentage', type: 'number', tab: 'Education' },
    { key: 'idProofType', label: 'ID Proof Type', type: 'select', tab: 'Identity', options: [{ value: 'National ID', label: 'National ID' }, { value: 'Passport', label: 'Passport' }, { value: 'Driving Licence', label: 'Driving Licence' }] },
    { key: 'idProofNumber', label: 'ID Proof Number', type: 'text', tab: 'Identity' },
    { key: 'taxId', label: 'Tax ID / PAN', type: 'text', tab: 'Identity' },
    { key: 'passportNumber', label: 'Passport Number', type: 'text', tab: 'Identity' },
    { key: 'passportExpiry', label: 'Passport Expiry', type: 'date', tab: 'Identity' },
    { key: 'visaNumber', label: 'Visa Number', type: 'text', tab: 'Identity' },
    { key: 'visaType', label: 'Visa Type', type: 'text', tab: 'Identity' },
    { key: 'visaExpiry', label: 'Visa Expiry', type: 'date', tab: 'Identity' },
    { key: 'visaCountry', label: 'Visa Country', type: 'select', tab: 'Identity', options: COUNTRIES.map((country) => ({ value: country, label: country })) },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      tab: 'General', options: [
        { value: 'Active', label: 'Active' },
        { value: 'Pending', label: 'Pending' },
        { value: 'On Leave', label: 'On Leave' },
        { value: 'Resigned', label: 'Resigned' },
        { value: 'Terminated', label: 'Terminated' },
        { value: 'Retired', label: 'Retired' },
      ],
    },
  ];

  allRows: Employee[] = [];
  filteredRows: Employee[] = [];
  loading = true;
  error = '';
  showForm = false;
  editingRow: Employee | null = null;

  ngOnInit() {
    this.loadData();
    this.hrmsService.getDepartments().subscribe((departments) => {
      const field = this.fields.find((f) => f.key === 'department');
      if (field) field.options = departments.map((d) => ({ value: d.name, label: d.name }));
    });
    this.hrmsService.getDesignations().subscribe((designations) => {
      const field = this.fields.find((f) => f.key === 'designation');
      if (field) field.options = designations.map((d) => ({ value: d.title, label: d.title }));
    });
  }

  loadData() {
    this.loading = true;
    this.hrService.getAll().subscribe({
      next: (data) => {
        this.allRows = data;
        this.filteredRows = data;
        const managerField = this.fields.find((f) => f.key === 'manager');
        if (managerField) managerField.options = data.map((employee) => ({ value: employee.name, label: `${employee.name} (${employee.designation})` }));
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load employees. Is the HR API running?';
        this.loading = false;
      },
    });
  }

  onSearch(term: string) {
    const t = term.toLowerCase();
    this.filteredRows = this.allRows.filter((e) => `${e.name} ${e.empId} ${e.email} ${e.phone} ${e.department} ${e.designation}`.toLowerCase().includes(t));
  }

  openCreate() {
    this.editingRow = null;
    const field = this.fields.find((f) => f.key === 'empId');
    if (field) field.compute = () => this.nextEmployeeId();
    this.showForm = true;
  }

  openEdit(row: Employee) {
    this.editingRow = row;
    const field = this.fields.find((f) => f.key === 'empId');
    if (field) field.compute = () => row.empId;
    this.showForm = true;
  }

  onSave(value: Record<string, unknown>) {
    const empId = String(value['empId'] ?? '').trim();
    const duplicate = this.allRows.some((row) => row.id !== this.editingRow?.id && row.empId.toLowerCase() === empId.toLowerCase());
    if (duplicate) {
      this.toast.error(`Employee ID ${empId} is already in use.`);
      return;
    }

    const employee = {
      ...value,
      empId,
      lastWorkingDate: value['lastWorkingDate'] || null,
      dateOfBirth: value['dateOfBirth'] || null,
      bloodGroup: value['bloodGroup'] || '',
      manager: value['manager'] || '',
      address: value['address'] || '',
      country: value['country'] || '',
      emergencyContactName: value['emergencyContactName'] || '',
      emergencyContactPhone: value['emergencyContactPhone'] || '',
      notes: value['notes'] || '',
      bankAccount: value['bankAccount'] || '',
      bankName: value['bankName'] || '',
      bankBranch: value['bankBranch'] || '',
      accountType: value['accountType'] || '',
      ifscSwiftCode: value['ifscSwiftCode'] || '',
      iban: value['iban'] || '',
      paymentMode: value['paymentMode'] || 'Bank Transfer',
      highestQualification: value['highestQualification'] || '',
      institution: value['institution'] || '',
      graduationYear: value['graduationYear'] ? Number(value['graduationYear']) : null,
      percentage: value['percentage'] ? Number(value['percentage']) : null,
      additionalQualification: value['additionalQualification'] || '',
      additionalInstitution: value['additionalInstitution'] || '',
      additionalGraduationYear: value['additionalGraduationYear'] ? Number(value['additionalGraduationYear']) : null,
      additionalPercentage: value['additionalPercentage'] ? Number(value['additionalPercentage']) : null,
      idProofType: value['idProofType'] || '',
      idProofNumber: value['idProofNumber'] || '',
      taxId: value['taxId'] || '',
      passportNumber: value['passportNumber'] || '',
      passportExpiry: value['passportExpiry'] || null,
      visaNumber: value['visaNumber'] || '',
      visaType: value['visaType'] || '',
      visaExpiry: value['visaExpiry'] || null,
      visaCountry: value['visaCountry'] || '',
      status: value['status'] || 'Active',
    } as unknown as Partial<Employee>;

    if (this.editingRow) {
      const updated = { ...this.editingRow, ...employee } as Employee;
      this.hrService.update(this.editingRow.id, updated).subscribe(() => {
        this.showForm = false;
        this.toast.success('Employee updated successfully.');
        this.loadData();
      }, (error) => this.toast.error(error?.error?.message ?? 'Failed to update the employee.'));
    } else {
      this.hrService.create(employee).subscribe(() => {
        this.showForm = false;
        this.toast.success('Employee created successfully.');
        this.loadData();
      }, (error) => this.toast.error(error?.error?.message ?? 'Failed to create the employee.'));
    }
  }

  nextEmployeeId() {
    const next = this.allRows.map((employee) => Number(employee.empId.replace(/^KZ-/, '')) || 0).reduce((max, value) => Math.max(max, value), 0) + 1;
    return `KZ-${String(next).padStart(4, '0')}`;
  }

  onDelete(row: Employee) {
    if (!confirm(`Delete employee ${row.name}?`)) return;
    this.hrService.delete(row.id).subscribe(() => {
      this.toast.success('Employee deleted successfully.');
      this.loadData();
    }, () => this.toast.error('Failed to delete the employee.'));
  }
}
