import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PolicyGuard, SkipPolicy } from '../../common/guards/policy.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UserRoleAssignmentService } from '../rbac/user-role-assignment.service';
import { UserPermissionService } from '../rbac/user-permission.service';
import { AuthorizationService } from '../rbac/authorization.service';
import { User } from './entities/user.entity';
import { AssignRoleDto } from '../rbac/dto/assign-role.dto';
import { SetPermissionsDto } from '../rbac/dto/set-permissions.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MergeUsersDto } from './dto/merge-users.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PolicyGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userRoleAssignmentService: UserRoleAssignmentService,
    private readonly userPermissionService: UserPermissionService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @SkipPolicy()
  @Get('me')
  async getMe(
    @CurrentUser() user: { userId: string },
  ): Promise<User | null> {
    return this.usersService.findById(user.userId);
  }

  @Post()
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() caller: { userId: string },
  ) {
    const user = await this.usersService.create(dto);
    if (dto.roleIds?.length) {
      await this.userRoleAssignmentService.setUserRoles(
        user.id,
        dto.roleIds,
        caller.userId,
      );
    }
    return user;
  }

  @Post('merge')
  async mergeUsers(
    @Body() dto: MergeUsersDto,
    @CurrentUser() caller: { userId: string },
  ) {
    const isAdmin = await this.authorizationService.isAdmin(caller.userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only administrators can merge users');
    }
    await this.usersService.mergeUsers(dto.keepUserId, dto.removeUserId);
    return { message: 'Users merged successfully' };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: { userId: string },
  ): Promise<void> {
    return this.usersService.remove(id, caller.userId);
  }

  @Get(':id/roles')
  async getUserRoles(@Param('id', ParseUUIDPipe) id: string) {
    return this.userRoleAssignmentService.getUserRoles(id);
  }

  @Put(':id/roles')
  async setUserRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() caller: { userId: string },
  ) {
    // Only admins can assign roles
    const isAdmin = await this.authorizationService.isAdmin(caller.userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only administrators can manage user roles');
    }
    return this.userRoleAssignmentService.setUserRoles(
      id,
      dto.roleIds,
      caller.userId,
    );
  }

  // --- Direct user permissions ---

  @Get(':id/permissions')
  async getUserPermissions(@Param('id', ParseUUIDPipe) id: string) {
    return this.userPermissionService.getUserPermissions(id);
  }

  @Put(':id/permissions')
  async setUserPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetPermissionsDto,
    @CurrentUser() caller: { userId: string },
  ) {
    const isAdmin = await this.authorizationService.isAdmin(caller.userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only administrators can manage user permissions');
    }
    return this.userPermissionService.setUserPermissions(
      id,
      dto.permissions,
      caller.userId,
    );
  }

  // --- Keycloak admin actions ---

  @Post(':id/reset-password')
  async resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { temporaryPassword?: string },
    @CurrentUser() caller: { userId: string },
  ) {
    const isAdmin = await this.authorizationService.isAdmin(caller.userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only administrators can reset passwords');
    }
    return this.usersService.resetPassword(id, body.temporaryPassword);
  }

  @Post(':id/toggle-enabled')
  async toggleEnabled(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { enabled: boolean },
    @CurrentUser() caller: { userId: string },
  ) {
    const isAdmin = await this.authorizationService.isAdmin(caller.userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only administrators can enable/disable users');
    }
    await this.usersService.toggleEnabled(id, body.enabled);
    return { message: `User ${body.enabled ? 'enabled' : 'disabled'} successfully` };
  }

  @Post(':id/required-actions')
  async setRequiredActions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { actions: string[] },
    @CurrentUser() caller: { userId: string },
  ) {
    const isAdmin = await this.authorizationService.isAdmin(caller.userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only administrators can set required actions');
    }
    await this.usersService.setRequiredActions(id, body.actions);
    return { message: 'Required actions updated' };
  }

  @Post(':id/send-verify-email')
  async sendVerifyEmail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: { userId: string },
  ) {
    const isAdmin = await this.authorizationService.isAdmin(caller.userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only administrators can send verify emails');
    }
    await this.usersService.sendVerifyEmail(id);
    return { message: 'Verification email sent' };
  }
}
