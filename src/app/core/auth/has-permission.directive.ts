import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { PermissionService } from './permission.service';

/**
 * Function-level access. Hides the element unless the user holds the permission:
 * `<button *hasPermission="'accounting.invoices.create'">New Invoice</button>`
 * Accepts an array to mean "any of these".
 */
@Directive({ selector: '[hasPermission]', standalone: true })
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private permissions = inject(PermissionService);

  private rendered = false;

  @Input() set hasPermission(code: string | string[]) {
    const codes = Array.isArray(code) ? code : [code];
    const allowed = this.permissions.hasAny(codes);

    if (allowed && !this.rendered) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.rendered = true;
    } else if (!allowed && this.rendered) {
      this.viewContainer.clear();
      this.rendered = false;
    }
  }
}
