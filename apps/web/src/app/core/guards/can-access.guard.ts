import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  Router,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';

@Injectable({ providedIn: 'root' })
export class CanAccessGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private permissionService: PermissionService,
    private router: Router,
  ) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    await this.authService.isDoneLoading;

    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return false;
    }

    // Ensure permissions are loaded
    await this.permissionService.loadPermissions();

    const resourceType = route.data?.['resourceType'] as string | undefined;
    const action = (route.data?.['action'] as string) || 'read';

    if (!resourceType) {
      return true;
    }

    if (this.permissionService.canGlobal(resourceType, action)) {
      return true;
    }

    // Redirect to cockpit if no access
    this.router.navigate(['/app/cockpit']);
    return false;
  }
}
