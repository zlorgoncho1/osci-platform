import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserGroup } from './entities/user-group.entity';
import { UserGroupMember } from './entities/user-group-member.entity';
import { GroupRoleAssignment } from './entities/group-role-assignment.entity';
import { GroupPermission } from './entities/group-permission.entity';
import { Role } from './entities/role.entity';
import { User } from '../users/entities/user.entity';
import { ResourceType, Action } from '../../common/enums';

@Injectable()
export class UserGroupService {
  constructor(
    @InjectRepository(UserGroup)
    private readonly groupRepo: Repository<UserGroup>,
    @InjectRepository(UserGroupMember)
    private readonly memberRepo: Repository<UserGroupMember>,
    @InjectRepository(GroupRoleAssignment)
    private readonly groupRoleRepo: Repository<GroupRoleAssignment>,
    @InjectRepository(GroupPermission)
    private readonly groupPermRepo: Repository<GroupPermission>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // --- CRUD Group ---

  async findAll(): Promise<UserGroup[]> {
    return this.groupRepo.find({
      relations: ['members'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<UserGroup> {
    const group = await this.groupRepo.findOne({
      where: { id },
      relations: ['members', 'members.user', 'roleAssignments', 'roleAssignments.role', 'permissions'],
    });
    if (!group) {
      throw new NotFoundException(`UserGroup with id ${id} not found`);
    }
    return group;
  }

  async create(data: {
    name: string;
    slug: string;
    description?: string | null;
  }): Promise<UserGroup> {
    const existing = await this.groupRepo.findOne({
      where: [{ name: data.name }, { slug: data.slug }],
    });
    if (existing) {
      throw new BadRequestException(
        `UserGroup with name "${data.name}" or slug "${data.slug}" already exists`,
      );
    }

    const group = this.groupRepo.create({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
    });
    return this.groupRepo.save(group);
  }

  async update(
    id: string,
    data: { name?: string; slug?: string; description?: string | null },
  ): Promise<UserGroup> {
    const group = await this.findOne(id);

    // Check uniqueness of name/slug against other groups
    if (data.name !== undefined || data.slug !== undefined) {
      const conditions: any[] = [];
      if (data.name !== undefined) conditions.push({ name: data.name });
      if (data.slug !== undefined) conditions.push({ slug: data.slug });

      const conflict = await this.groupRepo.findOne({ where: conditions });
      if (conflict && conflict.id !== id) {
        throw new BadRequestException(
          `A group with that name or slug already exists`,
        );
      }
    }

    if (data.name !== undefined) group.name = data.name;
    if (data.slug !== undefined) group.slug = data.slug;
    if (data.description !== undefined) group.description = data.description || null;

    return this.groupRepo.save(group);
  }

  async remove(id: string): Promise<void> {
    const group = await this.findOne(id);
    await this.groupRepo.remove(group);
  }

  // --- Members ---

  async getMembers(groupId: string): Promise<User[]> {
    const members = await this.memberRepo.find({
      where: { groupId },
      relations: ['user'],
    });
    return members.map((m) => m.user);
  }

  async addMembers(groupId: string, userIds: string[]): Promise<void> {
    // Validate group exists
    await this.findOne(groupId);

    // Validate users exist
    const users = await this.userRepo.findBy({ id: In(userIds) });
    if (users.length !== userIds.length) {
      throw new BadRequestException('One or more user IDs are invalid');
    }

    // Add only users not already members
    const existing = await this.memberRepo.find({ where: { groupId } });
    const existingUserIds = new Set(existing.map((m) => m.userId));

    const newMembers = userIds
      .filter((uid) => !existingUserIds.has(uid))
      .map((uid) =>
        this.memberRepo.create({ groupId, userId: uid }),
      );

    if (newMembers.length > 0) {
      await this.memberRepo.save(newMembers);
    }
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    const member = await this.memberRepo.findOne({
      where: { groupId, userId },
    });
    if (!member) {
      throw new NotFoundException('User is not a member of this group');
    }
    await this.memberRepo.remove(member);
  }

  // --- Group Roles ---

  async getGroupRoles(groupId: string): Promise<Role[]> {
    const assignments = await this.groupRoleRepo.find({
      where: { groupId },
      relations: ['role', 'role.permissions'],
    });
    return assignments.map((a) => a.role);
  }

  async setGroupRoles(groupId: string, roleIds: string[]): Promise<Role[]> {
    await this.findOne(groupId);

    // Deduplicate roleIds
    const uniqueRoleIds = [...new Set(roleIds)];

    const roles = await this.roleRepo.findBy({ id: In(uniqueRoleIds) });
    if (roles.length !== uniqueRoleIds.length) {
      throw new BadRequestException('One or more role IDs are invalid');
    }

    // Atomic delete + recreate inside a transaction
    await this.groupRoleRepo.manager.transaction(async (em) => {
      await em.delete(GroupRoleAssignment, { groupId });

      if (uniqueRoleIds.length > 0) {
        const assignments = uniqueRoleIds.map((roleId) =>
          em.create(GroupRoleAssignment, { groupId, roleId }),
        );
        await em.save(assignments);
      }
    });

    return this.getGroupRoles(groupId);
  }

  // --- Group Permissions ---

  async getGroupPermissions(groupId: string): Promise<GroupPermission[]> {
    return this.groupPermRepo.find({
      where: { groupId },
      order: { createdAt: 'ASC' },
    });
  }

  async setGroupPermissions(
    groupId: string,
    permissions: { resourceType: ResourceType; actions: Action[] }[],
  ): Promise<GroupPermission[]> {
    await this.findOne(groupId);

    // Deduplicate by resourceType — merge actions if same resourceType appears twice
    const deduped = new Map<ResourceType, Action[]>();
    for (const p of permissions) {
      const existing = deduped.get(p.resourceType);
      if (existing) {
        const merged = new Set([...existing, ...p.actions]);
        deduped.set(p.resourceType, Array.from(merged));
      } else {
        deduped.set(p.resourceType, [...p.actions]);
      }
    }

    // Atomic delete + recreate inside a transaction
    return this.groupPermRepo.manager.transaction(async (em) => {
      await em.delete(GroupPermission, { groupId });

      if (deduped.size === 0) {
        return [];
      }

      const entities = Array.from(deduped.entries()).map(([resourceType, actions]) =>
        em.create(GroupPermission, {
          groupId,
          resourceType,
          actions,
        }),
      );

      return em.save(entities);
    });
  }
}
