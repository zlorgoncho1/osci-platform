import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserRoleAssignment } from './entities/user-role-assignment.entity';
import { ResourceAccess } from './entities/resource-access.entity';
import { UserPermission } from './entities/user-permission.entity';
import { UserGroup } from './entities/user-group.entity';
import { UserGroupMember } from './entities/user-group-member.entity';
import { GroupRoleAssignment } from './entities/group-role-assignment.entity';
import { GroupPermission } from './entities/group-permission.entity';
import { User } from '../users/entities/user.entity';
import { RolesService } from './roles.service';
import { AuthorizationService } from './authorization.service';
import { ResourceAccessService } from './resource-access.service';
import { UserRoleAssignmentService } from './user-role-assignment.service';
import { UserPermissionService } from './user-permission.service';
import { UserGroupService } from './user-group.service';
import { RolesController } from './roles.controller';
import { ResourceAccessController } from './resource-access.controller';
import { UserGroupsController } from './user-groups.controller';
import { RbacSeedService } from './rbac-seed.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role,
      Permission,
      UserRoleAssignment,
      ResourceAccess,
      UserPermission,
      UserGroup,
      UserGroupMember,
      GroupRoleAssignment,
      GroupPermission,
      User,
    ]),
  ],
  controllers: [RolesController, ResourceAccessController, UserGroupsController],
  providers: [
    RolesService,
    AuthorizationService,
    ResourceAccessService,
    UserRoleAssignmentService,
    UserPermissionService,
    UserGroupService,
    RbacSeedService,
  ],
  exports: [
    AuthorizationService,
    ResourceAccessService,
    UserRoleAssignmentService,
    UserPermissionService,
    UserGroupService,
    RolesService,
  ],
})
export class RbacModule {}
