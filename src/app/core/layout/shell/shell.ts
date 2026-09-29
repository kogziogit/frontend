import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { APP_MODULES } from '../../config/apps.config';
import { AuthService } from '../../auth/auth.service';
import { PermissionService } from '../../auth/permission.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private permissions = inject(PermissionService);
  readonly apps = APP_MODULES.filter((app) => this.permissions.has(app.key));
  switcherOpen = false;
  userMenuOpen = false;
  readonly currentUser;

  constructor(public router: Router, private auth: AuthService) {
    this.currentUser = this.auth.currentUser;
  }

  toggleSwitcher() {
    this.switcherOpen = !this.switcherOpen;
    this.userMenuOpen = false;
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
    this.switcherOpen = false;
  }

  closeMenus() {
    this.switcherOpen = false;
    this.userMenuOpen = false;
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  get activeApp() {
    const path = this.router.url.split('/')[1];
    return this.apps.find((a) => a.key === path);
  }
}
