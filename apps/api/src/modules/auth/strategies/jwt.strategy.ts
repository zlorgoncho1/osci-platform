import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

interface KeycloakJwtPayload {
  sub: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  realm_access?: {
    roles?: string[];
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const keycloakIssuer =
      configService.get<string>('KEYCLOAK_ISSUER') ||
      configService.get<string>('API_JWT_ISSUER') ||
      '';
    if (!keycloakIssuer) {
      throw new Error('Missing KEYCLOAK_ISSUER (or API_JWT_ISSUER) configuration');
    }

    const keycloakIssuerExternal =
      configService.get<string>('KEYCLOAK_ISSUER_EXTERNAL') || keycloakIssuer;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${keycloakIssuer}/protocol/openid-connect/certs`,
      }),
      issuer: keycloakIssuerExternal,
      algorithms: ['RS256'],
    });
  }

  validate(payload: KeycloakJwtPayload) {
    const user = {
      sub: payload.sub,
      email: payload.email,
      roles: payload.realm_access?.roles || [],
      firstName: payload.given_name,
      lastName: payload.family_name,
    };
    return user;
  }
}
