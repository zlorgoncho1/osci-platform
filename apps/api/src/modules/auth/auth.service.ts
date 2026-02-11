import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

interface JwtUserPayload {
  sub: string;
  email: string;
  roles: string[];
  firstName?: string;
  lastName?: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  getProfile(user: JwtUserPayload) {
    return {
      sub: user.sub,
      email: user.email,
      roles: user.roles,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  async validateUser(payload: JwtUserPayload) {
    return this.usersService.findOrCreate({
      sub: payload.sub,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      roles: payload.roles,
    });
  }
}
