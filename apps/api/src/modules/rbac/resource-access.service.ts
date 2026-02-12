import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceAccess } from './entities/resource-access.entity';
import { ResourceType, Action } from '../../common/enums';
import { AuthorizationService } from './authorization.service';

@Injectable()
export class ResourceAccessService {
  constructor(
    @InjectRepository(ResourceAccess)
    private readonly accessRepo: Repository<ResourceAccess>,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async findByResource(
    resourceType: ResourceType,
    resourceId: string,
  ): Promise<ResourceAccess[]> {
    return this.accessRepo.find({
      where: { resourceType, resourceId },
      relations: ['user', 'grantedBy'],
      order: { createdAt: 'ASC' },
    });
  }

  async grantAccess(
    resourceType: ResourceType,
    resourceId: string,
    userId: string,
    actions: Action[],
    grantedById: string,
    createdById?: string | null,
  ): Promise<ResourceAccess> {
    // Check caller has manage permission on this resource
    const canManage = await this.authorizationService.can(
      grantedById,
      resourceType,
      resourceId,
      Action.Manage,
      createdById,
    );
    if (!canManage) {
      throw new ForbiddenException(
        'You do not have manage permission on this resource',
      );
    }

    // Upsert
    let access = await this.accessRepo.findOne({
      where: { resourceType, resourceId, userId },
    });

    if (access) {
      access.actions = actions;
      access.grantedById = grantedById;
    } else {
      access = this.accessRepo.create({
        resourceType,
        resourceId,
        userId,
        actions,
        grantedById,
      });
    }

    return this.accessRepo.save(access);
  }

  async updateAccess(
    resourceType: ResourceType,
    resourceId: string,
    userId: string,
    actions: Action[],
    callerId: string,
    createdById?: string | null,
  ): Promise<ResourceAccess> {
    const canManage = await this.authorizationService.can(
      callerId,
      resourceType,
      resourceId,
      Action.Manage,
      createdById,
    );
    if (!canManage) {
      throw new ForbiddenException(
        'You do not have manage permission on this resource',
      );
    }

    const access = await this.accessRepo.findOne({
      where: { resourceType, resourceId, userId },
    });
    if (!access) {
      throw new NotFoundException('Access entry not found');
    }

    access.actions = actions;
    return this.accessRepo.save(access);
  }

  async revokeAccess(
    resourceType: ResourceType,
    resourceId: string,
    userId: string,
    callerId: string,
    createdById?: string | null,
  ): Promise<void> {
    const canManage = await this.authorizationService.can(
      callerId,
      resourceType,
      resourceId,
      Action.Manage,
      createdById,
    );
    if (!canManage) {
      throw new ForbiddenException(
        'You do not have manage permission on this resource',
      );
    }

    const access = await this.accessRepo.findOne({
      where: { resourceType, resourceId, userId },
    });
    if (!access) {
      throw new NotFoundException('Access entry not found');
    }

    await this.accessRepo.remove(access);
  }

  async createCreatorAccess(
    resourceType: ResourceType,
    resourceId: string,
    userId: string,
  ): Promise<ResourceAccess> {
    const allActions = [
      Action.Read,
      Action.Create,
      Action.Update,
      Action.Delete,
      Action.Export,
      Action.Manage,
    ];

    const access = this.accessRepo.create({
      resourceType,
      resourceId,
      userId,
      actions: allActions,
      grantedById: userId,
    });

    return this.accessRepo.save(access);
  }
}
