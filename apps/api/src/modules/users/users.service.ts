import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

export interface KeycloakUserPayload {
  sub: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async findByKeycloakId(keycloakId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { keycloakId } });
  }

  async findOrCreate(payload: KeycloakUserPayload): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { keycloakId: payload.sub },
    });

    if (user) {
      user.email = payload.email;
      user.firstName = payload.firstName || user.firstName;
      user.lastName = payload.lastName || user.lastName;
      user.roles = payload.roles || user.roles;
      user.lastLoginAt = new Date();
      return this.userRepository.save(user);
    }

    user = this.userRepository.create({
      keycloakId: payload.sub,
      email: payload.email,
      firstName: payload.firstName || null,
      lastName: payload.lastName || null,
      roles: payload.roles || [],
      lastLoginAt: new Date(),
    });

    return this.userRepository.save(user);
  }
}
