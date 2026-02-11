import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const path = request.route?.path || request.url;
    const user = request.user;
    const params = request.params;

    return next.handle().pipe(
      tap({
        next: () => {
          this.logAction(method, path, user, params, request).catch((err) => {
            this.logger.error(`Failed to log audit entry: ${err.message}`);
          });
        },
      }),
    );
  }

  private async logAction(
    method: string,
    path: string,
    user: { sub?: string } | undefined,
    params: Record<string, string>,
    request: { ip?: string; body?: unknown },
  ): Promise<void> {
    const action = `${method} ${path}`;
    const actorId = user?.sub || 'anonymous';
    const objectId = params?.id || null;

    let objectType: string | null = null;
    const pathSegments = path.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      objectType = pathSegments[0];
    }

    let contextData: Record<string, unknown> | null = null;
    if (request.body && typeof request.body === 'object') {
      const bodyKeys = Object.keys(request.body as Record<string, unknown>);
      if (bodyKeys.length > 0) {
        contextData = { bodyKeys };
      }
    }

    await this.auditService.log({
      action,
      actorId,
      objectType,
      objectId,
      context: contextData,
      ipAddress: request.ip || null,
    });
  }
}
