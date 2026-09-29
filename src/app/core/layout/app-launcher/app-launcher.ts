import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { APP_MODULES } from '../../config/apps.config';
import { PermissionService } from '../../auth/permission.service';

@Component({
  selector: 'app-app-launcher',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './app-launcher.html',
  styleUrl: './app-launcher.scss',
})
export class AppLauncher {
  private permissions = inject(PermissionService);
  readonly apps = APP_MODULES.filter((app) => this.permissions.has(app.key));
}
