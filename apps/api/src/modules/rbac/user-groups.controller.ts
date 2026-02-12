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
import { PolicyGuard } from '../../common/guards/policy.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthorizationService } from './authorization.service';
import { UserGroupService } from './user-group.service';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { UpdateUserGroupDto } from './dto/update-user-group.dto';
import { AddGroupMembersDto } from './dto/add-group-members.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { SetPermissionsDto } from './dto/set-permissions.dto';

@ApiTags('user-groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PolicyGuard)
@Controller('user-groups')
export class UserGroupsController {
  constructor(
    private readonly userGroupService: UserGroupService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Get()
  async findAll() {
    return this.userGroupService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userGroupService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateUserGroupDto) {
    return this.userGroupService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserGroupDto,
  ) {
    return this.userGroupService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.userGroupService.remove(id);
  }

  // --- Members ---

  @Get(':id/members')
  async getMembers(@Param('id', ParseUUIDPipe) id: string) {
    return this.userGroupService.getMembers(id);
  }

  @Post(':id/members')
  async addMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddGroupMembersDto,
  ) {
    await this.userGroupService.addMembers(id, dto.userIds);
    return { message: 'Members added successfully' };
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    await this.userGroupService.removeMember(id, userId);
    return { message: 'Member removed successfully' };
  }

  // --- Roles ---

  @Get(':id/roles')
  async getGroupRoles(@Param('id', ParseUUIDPipe) id: string) {
    return this.userGroupService.getGroupRoles(id);
  }

  @Put(':id/roles')
  async setGroupRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() caller: { userId: string },
  ) {
    const isAdmin = await this.authorizationService.isAdmin(caller.userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only administrators can manage group roles');
    }
    return this.userGroupService.setGroupRoles(id, dto.roleIds);
  }

  // --- Permissions ---

  @Get(':id/permissions')
  async getGroupPermissions(@Param('id', ParseUUIDPipe) id: string) {
    return this.userGroupService.getGroupPermissions(id);
  }

  @Put(':id/permissions')
  async setGroupPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetPermissionsDto,
    @CurrentUser() caller: { userId: string },
  ) {
    const isAdmin = await this.authorizationService.isAdmin(caller.userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only administrators can manage group permissions');
    }
    return this.userGroupService.setGroupPermissions(id, dto.permissions);
  }
}
