import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PolicyGuard implements CanActivate {
  private readonly logger = new Logger(PolicyGuard.name);

  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const action = `${request.method}:${request.route?.path || request.path}`;
    const resource = request.params?.id || null;

    const opaUrl = this.configService.get<string>('OPA_URL');

    if (!opaUrl) {
      this.logger.warn('OPA_URL not configured, denying request (Zero Trust)');
      return false;
    }

    try {
      const response = await fetch(`${opaUrl}/v1/data/authz/allow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: {
            user: {
              sub: user?.sub,
              roles: user?.roles || [],
              email: user?.email,
            },
            action,
            resource,
          },
        }),
      });

      if (!response.ok) {
        this.logger.error(`OPA returned status ${response.status}`);
        return false;
      }

      const result = await response.json();
      return result?.result === true;
    } catch (error) {
      this.logger.error(
        `OPA unreachable, denying request (Zero Trust): ${error}`,
      );
      return false;
    }
  }
}
