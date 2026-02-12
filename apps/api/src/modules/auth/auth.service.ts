import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AuthorizationService, EffectivePermissions } from '../rbac/authorization.service';
import { User } from '../users/entities/user.entity';

interface JwtUserPayload {
  sub: string;
  email: string;
  roles: string[];
  firstName?: string;
  lastName?: string;
}

export interface AuthMeResponse {
  id: string;
  keycloakId: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  permissions: EffectivePermissions;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  mustChangePassword: boolean;
}

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly jwtRefreshExpiresIn: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly authorizationService: AuthorizationService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>('API_JWT_SECRET') || '';
    this.jwtRefreshSecret = this.configService.get<string>('API_JWT_REFRESH_SECRET') || '';
    this.jwtExpiresIn = this.configService.get<string>('API_JWT_EXPIRES_IN') || '15m';
    this.jwtRefreshExpiresIn = this.configService.get<string>('API_JWT_REFRESH_EXPIRES_IN') || '7d';
  }

  getProfile(user: JwtUserPayload) {
    return {
      sub: user.sub,
      email: user.email,
      roles: user.roles,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  async validateUser(payload: JwtUserPayload): Promise<User> {
    return this.usersService.findOrCreate({
      sub: payload.sub,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      roles: payload.roles,
    });
  }

  async getMe(userId: string): Promise<AuthMeResponse> {
    const user = await this.usersService.findById(userId);
    const permissions =
      await this.authorizationService.getEffectivePermissions(user.id);

    return {
      id: user.id,
      keycloakId: user.keycloakId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      permissions,
    };
  }

  private assertLocalAuthConfigured(): void {
    if (!this.jwtSecret || !this.jwtRefreshSecret) {
      throw new UnauthorizedException(
        'Local authentication is not configured (missing API_JWT_SECRET / API_JWT_REFRESH_SECRET)',
      );
    }
  }

  // --- Local authentication ---

  async login(email: string, password: string): Promise<LoginResponse> {
    this.assertLocalAuthConfigured();
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.enabled) {
      throw new UnauthorizedException('Account is disabled');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.usersService.updateLastLogin(user.id);

    const roles = await this.authorizationService.getUserRoleSlugs(user.id);

    const accessPayload = {
      sub: user.id,
      email: user.email,
      roles,
      iss: 'osci-api',
    };

    const access_token = this.jwtService.sign(accessPayload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn,
      algorithm: 'HS256',
    });

    const refreshPayload = { sub: user.id, type: 'refresh' };
    const refresh_token = this.jwtService.sign(refreshPayload, {
      secret: this.jwtRefreshSecret,
      expiresIn: this.jwtRefreshExpiresIn,
      algorithm: 'HS256',
    });

    return {
      access_token,
      refresh_token,
      mustChangePassword: user.mustChangePassword,
    };
  }

  async refresh(refreshToken: string): Promise<{ access_token: string }> {
    this.assertLocalAuthConfigured();
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.jwtRefreshSecret,
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user.enabled) {
        throw new UnauthorizedException('Account is disabled');
      }

      const roles = await this.authorizationService.getUserRoleSlugs(user.id);

      const accessPayload = {
        sub: user.id,
        email: user.email,
        roles,
        iss: 'osci-api',
      };

      const access_token = this.jwtService.sign(accessPayload, {
        secret: this.jwtSecret,
        expiresIn: this.jwtExpiresIn,
        algorithm: 'HS256',
      });

      return { access_token };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async changePassword(
    userId: string,
    oldPassword: string | undefined,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersService.findByIdWithPassword(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // If user has a password, verify old one
    if (user.passwordHash) {
      if (!oldPassword) {
        throw new UnauthorizedException('Current password is required');
      }
      const valid = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!valid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }

    const hash = await this.usersService.hashPassword(newPassword);
    await this.usersService.updatePassword(userId, hash, false);
  }
}
