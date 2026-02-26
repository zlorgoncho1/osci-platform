import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceAccess } from './entities/resource-access.entity';
import { UserRoleAssignment } from './entities/user-role-assignment.entity';
import { Permission } from './entities/permission.entity';
import { UserPermission } from './entities/user-permission.entity';
import { UserGroupMember } from './entities/user-group-member.entity';
import { GroupRoleAssignment } from './entities/group-role-assignment.entity';
import { GroupPermission } from './entities/group-permission.entity';
import { ResourceType, Action, UserRole, actionSatisfies } from '../../common/enums';

export interface EffectivePermissions {
  roles: string[];
  isAdmin: boolean;
  global: { resourceType: ResourceType; actions: Action[] }[];
  resources: {
    resourceType: ResourceType;
    resourceId: string;
    actions: Action[];
  }[];
}

@Injectable()
export class AuthorizationService {
  constructor(
    @InjectRepository(ResourceAccess)
    private readonly resourceAccessRepo: Repository<ResourceAccess>,
    @InjectRepository(UserRoleAssignment)
    private readonly assignmentRepo: Repository<UserRoleAssignment>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(UserPermission)
    private readonly userPermRepo: Repository<UserPermission>,
    @InjectRepository(UserGroupMember)
    private readonly groupMemberRepo: Repository<UserGroupMember>,
    @InjectRepository(GroupRoleAssignment)
    private readonly groupRoleRepo: Repository<GroupRoleAssignment>,
    @InjectRepository(GroupPermission)
    private readonly groupPermRepo: Repository<GroupPermission>,
  ) {}

  /**
   * Get the user's group IDs from UserGroupMember.
   */
  private async getUserGroupIds(userId: string): Promise<string[]> {
    const memberships = await this.groupMemberRepo.find({
      where: { userId },
    });
    return memberships.map((m) => m.groupId);
  }

  /**
   * Get effective role IDs = direct UserRoleAssignment + GroupRoleAssignment for user's groups.
   */
  private async getEffectiveRoleIds(userId: string): Promise<{
    roleIds: string[];
    roleSlugs: string[];
    groupIds: string[];
    directAssignments: UserRoleAssignment[];
  }> {
    // Direct role assignments
    const directAssignments = await this.assignmentRepo.find({
      where: { userId },
      relations: ['role'],
    });

    const roleIdSet = new Set(directAssignments.map((a) => a.roleId));
    const roleSlugSet = new Set(directAssignments.map((a) => a.role.slug));

    // Group role assignments
    const groupIds = await this.getUserGroupIds(userId);
    if (groupIds.length > 0) {
      const groupRoles = await this.groupRoleRepo
        .createQueryBuilder('gra')
        .leftJoinAndSelect('gra.role', 'role')
        .where('gra.groupId = ANY(:groupIds::uuid[])', { groupIds })
        .getMany();

      for (const gr of groupRoles) {
        roleIdSet.add(gr.roleId);
        roleSlugSet.add(gr.role.slug);
      }
    }

    return {
      roleIds: Array.from(roleIdSet),
      roleSlugs: Array.from(roleSlugSet),
      groupIds,
      directAssignments,
    };
  }

  /**
   * Returns effective role slugs: direct assignments + inherited from groups.
   */
  async getUserRoleSlugs(userId: string): Promise<string[]> {
    const { roleSlugs } = await this.getEffectiveRoleIds(userId);
    return roleSlugs;
  }

  async isAdmin(userId: string): Promise<boolean> {
    const slugs = await this.getUserRoleSlugs(userId);
    return slugs.includes(UserRole.SecurityAdmin);
  }

  async can(
    userId: string,
    resourceType: ResourceType,
    resourceId: string | null,
    action: Action,
    createdById?: string | null,
  ): Promise<boolean> {
    // Load effective roles (direct + group) — groupIds also returned to avoid double query
    const { roleIds, roleSlugs, groupIds } = await this.getEffectiveRoleIds(userId);

    // 1. SecurityAdmin → always allowed
    if (roleSlugs.includes(UserRole.SecurityAdmin)) {
      return true;
    }

    // 2. Check global permissions from effective roles
    if (roleIds.length > 0) {
      const permissions = await this.permissionRepo
        .createQueryBuilder('p')
        .where('p.roleId = ANY(:roleIds::uuid[])', { roleIds })
        .andWhere('p.resourceType = :resourceType', { resourceType })
        .getMany();

      if (permissions.some((p) => actionSatisfies(p.actions, action))) {
        return true;
      }
    }

    // 3. Check group-level permissions (GroupPermission)
    if (groupIds.length > 0) {
      const groupPerms = await this.groupPermRepo
        .createQueryBuilder('gp')
        .where('gp.groupId = ANY(:groupIds::uuid[])', { groupIds })
        .andWhere('gp.resourceType = :resourceType', { resourceType })
        .getMany();

      if (groupPerms.some((gp) => actionSatisfies(gp.actions, action))) {
        return true;
      }
    }

    // 4. Check direct user permissions (UserPermission)
    const userPerm = await this.userPermRepo.findOne({
      where: { userId, resourceType },
    });
    if (userPerm && actionSatisfies(userPerm.actions, action)) {
      return true;
    }

    // 5. Instance-level access (ResourceAccess)
    if (resourceId) {
      const access = await this.resourceAccessRepo.findOne({
        where: { resourceType, resourceId, userId },
      });

      if (access) {
        return actionSatisfies(access.actions, action);
      }

      // Creator without explicit ResourceAccess → full access
      if (createdById && createdById === userId) {
        return true;
      }
    }

    return false;
  }

  async getAccessibleResourceIds(
    userId: string,
    resourceType: ResourceType,
  ): Promise<string[] | 'all'> {
    const { roleIds, roleSlugs, groupIds } = await this.getEffectiveRoleIds(userId);

    // SecurityAdmin → all
    if (roleSlugs.includes(UserRole.SecurityAdmin)) {
      return 'all';
    }

    // Check global role permissions
    if (roleIds.length > 0) {
      const permissions = await this.permissionRepo
        .createQueryBuilder('p')
        .where('p.roleId = ANY(:roleIds::uuid[])', { roleIds })
        .andWhere('p.resourceType = :resourceType', { resourceType })
        .getMany();

      if (permissions.some((p) => actionSatisfies(p.actions, Action.Read))) {
        return 'all';
      }
    }

    // Check group permissions
    if (groupIds.length > 0) {
      const groupPerms = await this.groupPermRepo
        .createQueryBuilder('gp')
        .where('gp.groupId = ANY(:groupIds::uuid[])', { groupIds })
        .andWhere('gp.resourceType = :resourceType', { resourceType })
        .getMany();

      if (groupPerms.some((gp) => actionSatisfies(gp.actions, Action.Read))) {
        return 'all';
      }
    }

    // Check direct user permissions
    const userPerm = await this.userPermRepo.findOne({
      where: { userId, resourceType },
    });
    if (userPerm && actionSatisfies(userPerm.actions, Action.Read)) {
      return 'all';
    }

    // Fall back to resource-level access — any action implies read
    const accesses = await this.resourceAccessRepo.find({
      where: { resourceType, userId },
    });

    return accesses
      .filter((a) => actionSatisfies(a.actions, Action.Read))
      .map((a) => a.resourceId);
  }

  async getEffectivePermissions(userId: string): Promise<EffectivePermissions> {
    const { roleIds, roleSlugs, groupIds } = await this.getEffectiveRoleIds(userId);
    const admin = roleSlugs.includes(UserRole.SecurityAdmin);

    // Merge global permissions from all sources
    const merged = new Map<ResourceType, Set<Action>>();

    // 1. Permissions from effective roles (direct + group roles)
    if (roleIds.length > 0) {
      const rolePerms = await this.permissionRepo
        .createQueryBuilder('p')
        .where('p.roleId = ANY(:roleIds::uuid[])', { roleIds })
        .getMany();

      for (const p of rolePerms) {
        const existing = merged.get(p.resourceType) || new Set<Action>();
        for (const a of p.actions) existing.add(a);
        merged.set(p.resourceType, existing);
      }
    }

    // 2. GroupPermission (direct permissions on groups the user belongs to)
    if (groupIds.length > 0) {
      const groupPerms = await this.groupPermRepo
        .createQueryBuilder('gp')
        .where('gp.groupId = ANY(:groupIds::uuid[])', { groupIds })
        .getMany();

      for (const gp of groupPerms) {
        const existing = merged.get(gp.resourceType) || new Set<Action>();
        for (const a of gp.actions) existing.add(a);
        merged.set(gp.resourceType, existing);
      }
    }

    // 3. UserPermission (direct per-user permissions)
    const userPerms = await this.userPermRepo.find({ where: { userId } });
    for (const up of userPerms) {
      const existing = merged.get(up.resourceType) || new Set<Action>();
      for (const a of up.actions) existing.add(a);
      merged.set(up.resourceType, existing);
    }

    const global = Array.from(merged.entries()).map(([rt, actions]) => ({
      resourceType: rt,
      actions: Array.from(actions),
    }));

    // Resource-level permissions
    const accesses = await this.resourceAccessRepo.find({
      where: { userId },
    });

    const resources = accesses.map((a) => ({
      resourceType: a.resourceType,
      resourceId: a.resourceId,
      actions: a.actions,
    }));

    return {
      roles: roleSlugs,
      isAdmin: admin,
      global,
      resources,
    };
  }
}
