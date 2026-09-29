import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from './permission.service';

/**
 * Route-level access. Put the required permission code on the route:
 * `{ path: 'invoices', data: { permission: 'accounting.invoices.view' }, canActivate: [permissionGuard] }`
 */
export const permissionGuard: CanActivateFn = (route) => {
  const permissions = inject(PermissionService);
  const router = inject(Router);

  const required = route.data?.['permission'] as string | string[] | undefined;
  if (!required) return true;

  const codes = Array.isArray(required) ? required : [required];
  if (permissions.hasAny(codes)) return true;

  return router.createUrlTree(['/forbidden'], { queryParams: { required: codes.join(',') } });
};
