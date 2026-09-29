import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EntityFormField } from './entity-form-field';

@Component({
  selector: 'app-entity-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './entity-form-modal.html',
  styleUrl: './entity-form-modal.scss',
})
export class EntityFormModal implements OnInit {
  @Input() title = '';
  @Input() fields: EntityFormField[] = [];
  @Input() model: any = null;
  @Input() wide = false;
  @Output() save = new EventEmitter<Record<string, unknown>>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  activeTab = '';

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.activeTab = this.tabs[0] ?? '';
    const controls: Record<string, unknown> = {};
    for (const field of this.fields) {
      if (field.type === 'readonly') continue;
      const value = this.model?.[field.key]
        ?? (field.type === 'number' ? 0 : field.type === 'select' ? field.options?.[0]?.value ?? '' : '');
      const validators = field.required ? [Validators.required] : [];
      if (field.type === 'email') validators.push(Validators.email);
      controls[field.key] = [value, validators];
    }
    this.form = this.fb.group(controls);
  }

  get tabs(): string[] {
    return [...new Set(this.fields.map((field) => field.tab).filter((tab): tab is string => !!tab))];
  }

  fieldsForTab(tab: string) {
    return this.fields.filter((field) => (field.tab ?? this.tabs[0] ?? '') === tab);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = { ...(this.model ?? {}), ...this.form.value };
    this.save.emit(value);
  }

  isVisible(field: EntityFormField): boolean {
    if (!field.showWhen) return true;
    return this.form.get(field.showWhen.field)?.value === field.showWhen.value;
  }

  computeValue(field: EntityFormField): string {
    return field.compute ? field.compute(this.form.value) : '';
  }
}
