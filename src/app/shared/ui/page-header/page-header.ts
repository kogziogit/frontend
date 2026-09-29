import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div class="page-header__titles">
        <h1>{{ title }}</h1>
        @if (subtitle) {
          <p class="page-header__subtitle">{{ subtitle }}</p>
        }
      </div>
      <div class="page-header__actions">
        @if (searchable) {
          <div class="search-box">
            <span class="material-symbols-outlined">search</span>
            <input
              type="text"
              [placeholder]="'Search ' + title.toLowerCase()"
              (input)="search.emit($any($event.target).value)"
            />
          </div>
        }
        @if (createLabel) {
          <button class="btn btn--primary" (click)="create.emit()">
            <span class="material-symbols-outlined">add</span>
            {{ createLabel }}
          </button>
        }
      </div>
    </div>
  `,
  styleUrl: './page-header.scss',
})
export class PageHeader {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() createLabel = '';
  @Input() searchable = true;
  @Output() create = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();
}
