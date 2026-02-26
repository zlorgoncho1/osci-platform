import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EffectivePermissions {
  roles: string[];
  isAdmin: boolean;
  global: { resourceType: string; actions: string[] }[];
  resources: { resourceType: string; resourceId: string; actions: string[] }[];
}

export interface AuthMeResponse {
  id: string;
  keycloakId: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  permissions: EffectivePermissions;
}

/**
 * Action hierarchy: each action implicitly grants the actions listed here.
 * manage → all actions ; create/update/delete/export → read
 */
const ACTION_IMPLIES: Record<string, string[]> = {
  manage: ['read', 'create', 'update', 'delete', 'export'],
  create: ['read'],
  update: ['read'],
  delete: ['read'],
  export: ['read'],
  read: [],
};

function actionSatisfies(grantedActions: string[], requiredAction: string): boolean {
  for (const granted of grantedActions) {
    if (granted === requiredAction) return true;
    const implied = ACTION_IMPLIES[granted];
    if (implied && implied.includes(requiredAction)) return true;
  }
  return false;
}

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private permissionsSubject = new BehaviorSubject<EffectivePermissions | null>(
    null,
  );
  permissions$ = this.permissionsSubject.asObservable();

  private meSubject = new BehaviorSubject<AuthMeResponse | null>(null);
  me$ = this.meSubject.asObservable();

  private loadingPromise: Promise<void> | null = null;

  constructor(private http: HttpClient) {}

  async loadPermissions(): Promise<void> {
    // Dedup concurrent calls — return the same promise if already loading
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = this.doLoad();
    try {
      await this.loadingPromise;
    } finally {
      this.loadingPromise = null;
    }
  }

  private async doLoad(): Promise<void> {
    try {
      const me = await firstValueFrom(
        this.http.get<AuthMeResponse>(`${environment.apiUrl}/auth/me`),
      );
      this.meSubject.next(me);
      this.permissionsSubject.next(me.permissions);
    } catch {
      // Silently fail if not authenticated yet
    }
  }

  async reload(): Promise<void> {
    this.loadingPromise = null;
    return this.loadPermissions();
  }

  get permissions(): EffectivePermissions | null {
    return this.permissionsSubject.value;
  }

  get me(): AuthMeResponse | null {
    return this.meSubject.value;
  }

  get isAdmin(): boolean {
    return this.permissions?.isAdmin ?? false;
  }

  get roles(): string[] {
    return this.permissions?.roles ?? [];
  }

  hasRole(role: string): boolean {
    return this.isAdmin || this.roles.includes(role);
  }

  /**
   * Check if user has a specific action on a resource type (global check).
   */
  canGlobal(resourceType: string, action: string): boolean {
    if (this.isAdmin) return true;
    const perms = this.permissions;
    if (!perms) return false;

    const globalPerm = perms.global.find(
      (g) => g.resourceType === resourceType,
    );
    if (globalPerm && actionSatisfies(globalPerm.actions, action)) return true;

    // Also check if user has at least one resource-level access with this action
    const hasAny = perms.resources.some(
      (r) =>
        r.resourceType === resourceType && actionSatisfies(r.actions, action),
    );
    if (hasAny) return true;

    return false;
  }

  /**
   * Check if user can perform an action on a specific resource instance.
   */
  canResource(
    resourceType: string,
    resourceId: string,
    action: string,
  ): boolean {
    if (this.isAdmin) return true;
    const perms = this.permissions;
    if (!perms) return false;

    // Check global permissions first
    const globalPerm = perms.global.find(
      (g) => g.resourceType === resourceType,
    );
    if (globalPerm && actionSatisfies(globalPerm.actions, action)) return true;

    // Check resource-level
    const resourcePerm = perms.resources.find(
      (r) =>
        r.resourceType === resourceType && r.resourceId === resourceId,
    );
    if (!resourcePerm) return false;
    return actionSatisfies(resourcePerm.actions, action);
  }

  clear(): void {
    this.permissionsSubject.next(null);
    this.meSubject.next(null);
    this.loadingPromise = null;
  }
}
