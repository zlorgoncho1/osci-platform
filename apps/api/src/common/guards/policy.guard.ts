import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthorizationService } from '../../modules/rbac/authorization.service';
import { ResourceType, Action } from '../enums';

export const RESOURCE_KEY = 'rbac_resource';
export const SKIP_POLICY_KEY = 'skip_policy';

export interface ResourcePolicy {
  type: ResourceType;
  action: Action;
  idParam?: string;
}

/** Decorator to declare required resource policy on a handler */
export function RequirePermission(policy: ResourcePolicy) {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(RESOURCE_KEY, policy, descriptor?.value ?? target);
  };
}

/** Decorator to skip PolicyGuard on a specific handler */
export function SkipPolicy() {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(SKIP_POLICY_KEY, true, descriptor?.value ?? target);
  };
}

@Injectable()
export class PolicyGuard implements CanActivate {
  private readonly logger = new Logger(PolicyGuard.name);

  private static readonly METHOD_ACTION_MAP: Record<string, Action> = {
    GET: Action.Read,
    POST: Action.Create,
    PUT: Action.Update,
    PATCH: Action.Update,
    DELETE: Action.Delete,
  };

  private static readonly PATH_RESOURCE_MAP: Record<string, ResourceType> = {
    projects: ResourceType.Project,
    objects: ResourceType.Object,
    'object-groups': ResourceType.ObjectGroup,
    checklists: ResourceType.Checklist,
    tasks: ResourceType.Task,
    evidence: ResourceType.Evidence,
    incidents: ResourceType.Incident,
    reports: ResourceType.Report,
    'audit-logs': ResourceType.AuditLog,
    referentiels: ResourceType.Referentiel,
    cartography: ResourceType.CartographyAsset,
    integrations: ResourceType.Integration,
    users: ResourceType.User,
    roles: ResourceType.User,
    'user-groups': ResourceType.UserGroup,
    scores: ResourceType.Object,
  };

  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if handler has @SkipPolicy() decorator
    const skipPolicy = this.reflector.get<boolean>(
      SKIP_POLICY_KEY,
      context.getHandler(),
    );
    if (skipPolicy) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.userId) {
      this.logger.warn('No userId in request — denying');
      return false;
    }

    // Check if handler has explicit @RequirePermission decorator
    const policy = this.reflector.get<ResourcePolicy>(
      RESOURCE_KEY,
      context.getHandler(),
    );

    if (policy) {
      const resourceId = policy.idParam
        ? request.params?.[policy.idParam]
        : null;
      return this.authorizationService.can(
        user.userId,
        policy.type,
        resourceId,
        policy.action,
      );
    }

    // Auto-detect resource type and action from route
    const action =
      PolicyGuard.METHOD_ACTION_MAP[request.method] || Action.Read;

    const pathSegments = (request.route?.path || request.path || '')
      .replace(/^\//, '')
      .split('/');
    const resourceSegment = pathSegments[0];
    const resourceType = PolicyGuard.PATH_RESOURCE_MAP[resourceSegment];

    if (!resourceType) {
      this.logger.warn(
        `Deny by default — unmapped path segment "${resourceSegment}" for ${request.method} ${request.path}`,
      );
      return false;
    }

    const resourceId = request.params?.id || null;

    return this.authorizationService.can(
      user.userId,
      resourceType,
      resourceId,
      action,
    );
  }
}
