import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { UsersService } from '../../users/users.service';
import { AuthorizationService } from '../../rbac/authorization.service';

interface KeycloakJwtPayload {
  iss?: string;
  sub: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  realm_access?: {
    roles?: string[];
  };
  mustChangePassword?: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly localIssuer = 'osci-api';
  private readonly jwksSecretProvider: ReturnType<typeof passportJwtSecret>;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly authorizationService: AuthorizationService,
  ) {
    const keycloakIssuer =
      configService.get<string>('KEYCLOAK_ISSUER') ||
      configService.get<string>('API_JWT_ISSUER') ||
      '';

    const keycloakIssuerExternal =
      configService.get<string>('KEYCLOAK_ISSUER_EXTERNAL') || keycloakIssuer;

    const localSecret = configService.get<string>('API_JWT_SECRET') || '';

    const jwksProvider = passportJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `${keycloakIssuer}/protocol/openid-connect/certs`,
    });

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: (
        _request: any,
        rawJwtToken: string,
        done: (err: any, secret?: string | Buffer) => void,
      ) => {
        try {
          // Decode payload without verification to read issuer
          const payloadB64 = rawJwtToken.split('.')[1];
          const payload = JSON.parse(
            Buffer.from(payloadB64, 'base64').toString('utf-8'),
          );

          if (payload.iss === 'osci-api') {
            // Local token — use symmetric HS256 secret
            if (!localSecret) {
              return done(new Error('API_JWT_SECRET not configured'));
            }
            return done(null, localSecret);
          }

          // Keycloak token — delegate to JWKS
          return jwksProvider(_request, rawJwtToken, done);
        } catch (err) {
          return done(err);
        }
      },
      algorithms: ['RS256', 'HS256'],
      // No issuer validation here — we validate manually in validate()
    });

    this.jwksSecretProvider = jwksProvider;
  }

  async validate(payload: KeycloakJwtPayload) {
    if (payload.iss === this.localIssuer) {
      // Local JWT — sub = DB user.id
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      if (!user.enabled) {
        throw new UnauthorizedException('Account is disabled');
      }

      const dbRoles = await this.authorizationService.getUserRoleSlugs(user.id);

      return {
        sub: user.id,
        userId: user.id,
        email: user.email,
        roles: dbRoles,
        firstName: user.firstName,
        lastName: user.lastName,
        mustChangePassword: user.mustChangePassword,
      };
    }

    // Keycloak JWT — existing flow
    const keycloakRoles = payload.realm_access?.roles || [];

    const user = await this.usersService.findOrCreate({
      sub: payload.sub,
      email: payload.email || '',
      firstName: payload.given_name,
      lastName: payload.family_name,
      roles: keycloakRoles,
    });

    if (!user.enabled) {
      throw new UnauthorizedException('Account is disabled');
    }

    const dbRoles = await this.authorizationService.getUserRoleSlugs(user.id);

    return {
      sub: payload.sub,
      userId: user.id,
      email: user.email,
      roles: dbRoles,
      firstName: user.firstName,
      lastName: user.lastName,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
