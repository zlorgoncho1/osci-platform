import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  ParseEnumPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResourceAccessService } from './resource-access.service';
import { AuthorizationService } from './authorization.service';
import { GrantAccessDto, UpdateAccessDto } from './dto/grant-access.dto';
import { ResourceType, Action } from '../../common/enums';

@ApiTags('rbac-resource-access')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('resources')
export class ResourceAccessController {
  constructor(
    private readonly resourceAccessService: ResourceAccessService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Get(':resourceType/:resourceId/access')
  async getAccess(
    @Param('resourceType', new ParseEnumPipe(ResourceType)) resourceType: ResourceType,
    @Param('resourceId', ParseUUIDPipe) resourceId: string,
    @CurrentUser() caller: { userId: string },
  ) {
    // User must have at least read access on the resource to view its ACL
    const canRead = await this.authorizationService.can(
      caller.userId,
      resourceType,
      resourceId,
      Action.Read,
    );
    if (!canRead) {
      throw new ForbiddenException(
        'You do not have read permission on this resource',
      );
    }
    return this.resourceAccessService.findByResource(resourceType, resourceId);
  }

  @Post(':resourceType/:resourceId/access')
  async grantAccess(
    @Param('resourceType', new ParseEnumPipe(ResourceType)) resourceType: ResourceType,
    @Param('resourceId', ParseUUIDPipe) resourceId: string,
    @Body() dto: GrantAccessDto,
    @CurrentUser() caller: { userId: string },
  ) {
    return this.resourceAccessService.grantAccess(
      resourceType,
      resourceId,
      dto.userId,
      dto.actions,
      caller.userId,
    );
  }

  @Patch(':resourceType/:resourceId/access/:userId')
  async updateAccess(
    @Param('resourceType', new ParseEnumPipe(ResourceType)) resourceType: ResourceType,
    @Param('resourceId', ParseUUIDPipe) resourceId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateAccessDto,
    @CurrentUser() caller: { userId: string },
  ) {
    return this.resourceAccessService.updateAccess(
      resourceType,
      resourceId,
      userId,
      dto.actions,
      caller.userId,
    );
  }

  @Delete(':resourceType/:resourceId/access/:userId')
  async revokeAccess(
    @Param('resourceType', new ParseEnumPipe(ResourceType)) resourceType: ResourceType,
    @Param('resourceId', ParseUUIDPipe) resourceId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() caller: { userId: string },
  ) {
    return this.resourceAccessService.revokeAccess(
      resourceType,
      resourceId,
      userId,
      caller.userId,
    );
  }
}
