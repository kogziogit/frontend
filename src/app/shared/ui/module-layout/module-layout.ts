import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PermissionService } from '../../../core/auth/permission.service';

export interface ModuleTab {
  label: string;
  path: string;
  permission?: string;
}

@Component({
  selector: 'app-module-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <nav class="module-tabs">
      @for (tab of tabs; track tab.path) {
        <a
          [routerLink]="tab.path"
          routerLinkActive="module-tabs__link--active"
          [routerLinkActiveOptions]="{ exact: tab.path === '' }"
          class="module-tabs__link"
        >
          {{ tab.label }}
        </a>
      }
    </nav>
    <div class="module-content">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .module-tabs {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid #e6e6e6;
      margin-bottom: 20px;
    }
    .module-tabs__link {
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 500;
      color: #6b6b76;
      border-bottom: 2px solid transparent;
    }
    .module-tabs__link--active {
      color: #464feb;
      border-bottom-color: #464feb;
    }
    .module-tabs__link:hover { color: #2b2b33; }
  `],
})
export class ModuleLayout implements OnInit {
  tabs: ModuleTab[] = [];

  constructor(private route: ActivatedRoute) {}

  private permissions = inject(PermissionService);

  ngOnInit() {
    const tabs: ModuleTab[] = this.route.snapshot.data['tabs'] ?? [];
    this.tabs = tabs.filter((tab) => !tab.permission || this.permissions.has(tab.permission));
  }
}
