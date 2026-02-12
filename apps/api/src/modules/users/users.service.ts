import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { KeycloakAdminService } from '../keycloak-admin/keycloak-admin.service';

export interface KeycloakUserPayload {
  sub: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly keycloakAdmin: KeycloakAdminService,
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
    // 1. Try to find by keycloakId (normal case — user already logged in before)
    let user = await this.userRepository.findOne({
      where: { keycloakId: payload.sub },
    });

    if (user) {
      user.email = payload.email;
      user.firstName = payload.firstName || user.firstName;
      user.lastName = payload.lastName || user.lastName;
      // Do NOT overwrite roles from JWT — DB (UserRoleAssignment) is the source of truth
      user.lastLoginAt = new Date();
      return this.userRepository.save(user);
    }

    // 2. Try to find by email (links a seeded user to their Keycloak account)
    user = await this.userRepository.findOne({
      where: { email: payload.email },
    });

    if (user) {
      user.keycloakId = payload.sub;
      user.firstName = payload.firstName || user.firstName;
      user.lastName = payload.lastName || user.lastName;
      user.lastLoginAt = new Date();
      return this.userRepository.save(user);
    }

    // 3. Create a brand new user
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

  async create(dto: CreateUserDto): Promise<User & { temporaryPassword?: string }> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException(
        `A user with email "${dto.email}" already exists`,
      );
    }

    let keycloakId: string | null = null;
    const tempPassword = dto.temporaryPassword || this.generateTempPassword();

    // Sync to Keycloak if configured
    if (this.keycloakAdmin.isEnabled) {
      try {
        keycloakId = await this.keycloakAdmin.createUser(
          dto.email,
          dto.firstName || null,
          dto.lastName || null,
          tempPassword,
        );
      } catch (err: any) {
        this.logger.warn(
          `Failed to create user in Keycloak (will continue with local only): ${err.message}`,
        );
      }
    }

    const passwordHash = await this.hashPassword(tempPassword);

    const user = this.userRepository.create({
      email: dto.email,
      firstName: dto.firstName || null,
      lastName: dto.lastName || null,
      keycloakId,
      passwordHash,
      mustChangePassword: true,
      roles: [],
    });

    const saved = await this.userRepository.save(user);
    // Never leak passwordHash in response
    delete (saved as any).passwordHash;
    return Object.assign(saved, { temporaryPassword: tempPassword });
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException(
          `A user with email "${dto.email}" already exists`,
        );
      }
      user.email = dto.email;
    }

    if (dto.firstName !== undefined) user.firstName = dto.firstName || null;
    if (dto.lastName !== undefined) user.lastName = dto.lastName || null;

    const saved = await this.userRepository.save(user);

    // Sync to Keycloak
    if (user.keycloakId && this.keycloakAdmin.isEnabled) {
      try {
        await this.keycloakAdmin.updateUser(user.keycloakId, {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
        });
      } catch (err: any) {
        this.logger.warn(`Failed to sync user update to Keycloak: ${err.message}`);
      }
    }

    return saved;
  }

  async remove(id: string, deleterId: string): Promise<void> {
    if (id === deleterId) {
      throw new BadRequestException('You cannot delete your own account');
    }
    const user = await this.findById(id);

    // Delete from Keycloak first
    if (user.keycloakId && this.keycloakAdmin.isEnabled) {
      try {
        await this.keycloakAdmin.deleteUser(user.keycloakId);
      } catch (err: any) {
        this.logger.warn(`Failed to delete user from Keycloak: ${err.message}`);
      }
    }

    await this.userRepository.remove(user);
  }

  // --- Password & auth helpers ---

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id })
      .getOne();
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }

  async updatePassword(
    id: string,
    hash: string,
    mustChange: boolean,
  ): Promise<void> {
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ passwordHash: hash, mustChangePassword: mustChange })
      .where('id = :id', { id })
      .execute();
  }

  async setEnabled(id: string, enabled: boolean): Promise<void> {
    await this.userRepository.update(id, { enabled });
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async resetPassword(
    id: string,
    temporaryPassword?: string,
  ): Promise<{ temporaryPassword: string }> {
    const user = await this.findById(id);
    const tempPassword = temporaryPassword || this.generateTempPassword();
    const hash = await this.hashPassword(tempPassword);
    await this.updatePassword(id, hash, true);

    // Sync to Keycloak
    if (user.keycloakId && this.keycloakAdmin.isEnabled) {
      try {
        await this.keycloakAdmin.resetPassword(user.keycloakId, tempPassword, true);
      } catch (err: any) {
        this.logger.warn(`Failed to reset password in Keycloak: ${err.message}`);
      }
    }

    return { temporaryPassword: tempPassword };
  }

  async toggleEnabled(id: string, enabled: boolean): Promise<void> {
    const user = await this.findById(id);
    await this.setEnabled(id, enabled);

    if (user.keycloakId && this.keycloakAdmin.isEnabled) {
      try {
        await this.keycloakAdmin.setEnabled(user.keycloakId, enabled);
      } catch (err: any) {
        this.logger.warn(`Failed to toggle enabled in Keycloak: ${err.message}`);
      }
    }
  }

  async setRequiredActions(id: string, actions: string[]): Promise<void> {
    const user = await this.findById(id);
    if (user.keycloakId && this.keycloakAdmin.isEnabled) {
      await this.keycloakAdmin.setRequiredActions(user.keycloakId, actions);
    }
  }

  async sendVerifyEmail(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user.keycloakId) {
      throw new BadRequestException('User has no Keycloak account');
    }
    if (this.keycloakAdmin.isEnabled) {
      await this.keycloakAdmin.sendVerifyEmail(user.keycloakId);
    }
  }

  // --- Merge ---

  async mergeUsers(keepId: string, removeId: string): Promise<void> {
    if (keepId === removeId) {
      throw new BadRequestException('Cannot merge a user with itself');
    }

    const keep = await this.findByIdWithPassword(keepId);
    if (!keep) {
      throw new NotFoundException(`User to keep (${keepId}) not found`);
    }
    const removeUser = await this.findByIdWithPassword(removeId);
    if (!removeUser) {
      throw new NotFoundException(`User to remove (${removeId}) not found`);
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // Transfer UserRoleAssignment (skip duplicates)
      await qr.query(
        `UPDATE user_role_assignments SET "userId" = $1
         WHERE "userId" = $2
         AND "roleId" NOT IN (
           SELECT "roleId" FROM user_role_assignments WHERE "userId" = $1
         )`,
        [keepId, removeId],
      );
      // Delete remaining duplicates
      await qr.query(
        `DELETE FROM user_role_assignments WHERE "userId" = $1`,
        [removeId],
      );

      // Transfer UserPermission — merge actions for overlapping resourceTypes
      // 1. For overlapping resourceType, merge actions into keep's entry
      await qr.query(
        `UPDATE user_permissions AS keep
         SET actions = (
           SELECT STRING_AGG(DISTINCT val, ',')
           FROM (
             SELECT unnest(STRING_TO_ARRAY(keep.actions, ',')) AS val
             UNION
             SELECT unnest(STRING_TO_ARRAY(remove_up.actions, ',')) AS val
           ) AS merged
           WHERE val <> ''
         )
         FROM user_permissions AS remove_up
         WHERE keep."userId" = $1
           AND remove_up."userId" = $2
           AND keep."resourceType" = remove_up."resourceType"`,
        [keepId, removeId],
      );
      // 2. Delete remove's overlapping entries
      await qr.query(
        `DELETE FROM user_permissions
         WHERE "userId" = $1
         AND "resourceType" IN (
           SELECT "resourceType" FROM user_permissions WHERE "userId" = $2
         )`,
        [removeId, keepId],
      );
      // 3. Transfer remaining non-overlapping entries
      await qr.query(
        `UPDATE user_permissions SET "userId" = $1 WHERE "userId" = $2`,
        [keepId, removeId],
      );

      // Transfer UserGroupMember (skip groups where keep is already a member)
      await qr.query(
        `UPDATE user_group_members SET "userId" = $1
         WHERE "userId" = $2
         AND "groupId" NOT IN (
           SELECT "groupId" FROM user_group_members WHERE "userId" = $1
         )`,
        [keepId, removeId],
      );
      await qr.query(
        `DELETE FROM user_group_members WHERE "userId" = $1`,
        [removeId],
      );

      // Transfer ResourceAccess — merge actions for overlapping resources
      // 1. For overlapping (resourceType, resourceId), merge actions into keep's entry
      await qr.query(
        `UPDATE resource_access AS keep
         SET actions = (
           SELECT STRING_AGG(DISTINCT val, ',')
           FROM (
             SELECT unnest(STRING_TO_ARRAY(keep.actions, ',')) AS val
             UNION
             SELECT unnest(STRING_TO_ARRAY(remove_ra.actions, ',')) AS val
           ) AS merged
           WHERE val <> ''
         )
         FROM resource_access AS remove_ra
         WHERE keep."userId" = $1
           AND remove_ra."userId" = $2
           AND keep."resourceType" = remove_ra."resourceType"
           AND keep."resourceId" = remove_ra."resourceId"`,
        [keepId, removeId],
      );
      // 2. Delete remove's overlapping entries (now merged into keep)
      await qr.query(
        `DELETE FROM resource_access
         WHERE "userId" = $1
         AND ("resourceType", "resourceId") IN (
           SELECT "resourceType", "resourceId" FROM resource_access WHERE "userId" = $2
         )`,
        [removeId, keepId],
      );
      // 3. Transfer remaining non-overlapping entries from remove to keep
      await qr.query(
        `UPDATE resource_access SET "userId" = $1 WHERE "userId" = $2`,
        [keepId, removeId],
      );

      // Transfer plain FK columns
      const fkUpdates = [
        ['objects', 'createdById'],
        ['checklists', 'createdById'],
        ['object_groups', 'createdById'],
        ['security_projects', 'createdById'],
        ['security_projects', 'ownerId'],
        ['tasks', 'assignedToId'],
        ['resource_access', 'grantedById'],
        ['user_permissions', 'grantedById'],
        ['user_role_assignments', 'createdById'],
      ];

      for (const [table, column] of fkUpdates) {
        await qr.query(
          `UPDATE "${table}" SET "${column}" = $1 WHERE "${column}" = $2`,
          [keepId, removeId],
        );
      }

      // Transfer keycloakId if keep doesn't have one
      if (!keep.keycloakId && removeUser.keycloakId) {
        await qr.query(
          `UPDATE users SET "keycloakId" = $1 WHERE id = $2`,
          [removeUser.keycloakId, keepId],
        );
      } else if (keep.keycloakId && removeUser.keycloakId) {
        // Both have Keycloak accounts — delete the remove user's KC account
        if (this.keycloakAdmin.isEnabled) {
          try {
            await this.keycloakAdmin.deleteUser(removeUser.keycloakId);
          } catch (err: any) {
            this.logger.warn(
              `Failed to delete merged user from Keycloak: ${err.message}`,
            );
          }
        }
      }

      // Transfer passwordHash if keep doesn't have one
      if (!keep.passwordHash && removeUser.passwordHash) {
        await qr.query(
          `UPDATE users SET "passwordHash" = $1 WHERE id = $2`,
          [removeUser.passwordHash, keepId],
        );
      }

      // Delete the merged-away user
      await qr.query(`DELETE FROM users WHERE id = $1`, [removeId]);

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }
}
