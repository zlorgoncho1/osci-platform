import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserRoleAssignment } from './entities/user-role-assignment.entity';
import { Role } from './entities/role.entity';

@Injectable()
export class UserRoleAssignmentService {
  constructor(
    @InjectRepository(UserRoleAssignment)
    private readonly assignmentRepo: Repository<UserRoleAssignment>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async getUserRoles(userId: string): Promise<Role[]> {
    const assignments = await this.assignmentRepo.find({
      where: { userId },
      relations: ['role', 'role.permissions'],
    });
    return assignments.map((a) => a.role);
  }

  async setUserRoles(
    userId: string,
    roleIds: string[],
    callerUserId: string,
  ): Promise<Role[]> {
    // Validate all roleIds exist
    const roles = await this.roleRepo.findBy({ id: In(roleIds) });
    if (roles.length !== roleIds.length) {
      throw new BadRequestException('One or more role IDs are invalid');
    }

    // Remove existing assignments
    await this.assignmentRepo.delete({ userId });

    // Create new assignments
    const assignments = roleIds.map((roleId) =>
      this.assignmentRepo.create({
        userId,
        roleId,
        createdById: callerUserId,
      }),
    );

    await this.assignmentRepo.save(assignments);

    return this.getUserRoles(userId);
  }

  async addUserRole(
    userId: string,
    roleId: string,
    callerUserId: string,
  ): Promise<void> {
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role with id ${roleId} not found`);
    }

    const existing = await this.assignmentRepo.findOne({
      where: { userId, roleId },
    });
    if (existing) return;

    const assignment = this.assignmentRepo.create({
      userId,
      roleId,
      createdById: callerUserId,
    });
    await this.assignmentRepo.save(assignment);
  }

  async removeUserRole(userId: string, roleId: string): Promise<void> {
    const assignment = await this.assignmentRepo.findOne({
      where: { userId, roleId },
    });
    if (!assignment) {
      throw new NotFoundException('Role assignment not found');
    }
    await this.assignmentRepo.remove(assignment);
  }

}
