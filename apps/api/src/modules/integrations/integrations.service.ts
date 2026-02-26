import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegrationConfig } from './entities/integration-config.entity';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { ResourceType } from '../../common/enums';
import { AuthorizationService } from '../rbac/authorization.service';
import { ResourceAccessService } from '../rbac/resource-access.service';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    @InjectRepository(IntegrationConfig)
    private readonly integrationRepository: Repository<IntegrationConfig>,
    private readonly authorizationService: AuthorizationService,
    private readonly resourceAccessService: ResourceAccessService,
  ) {}

  async findAll(userId: string): Promise<IntegrationConfig[]> {
    const accessibleIds = await this.authorizationService.getAccessibleResourceIds(userId, ResourceType.Integration);

    if (accessibleIds === 'all') {
      return this.integrationRepository.find({
        order: { createdAt: 'DESC' },
      });
    }

    const qb = this.integrationRepository
      .createQueryBuilder('i')
      .orderBy('i.createdAt', 'DESC');

    if (accessibleIds.length > 0) {
      qb.where('(i.id IN (:...accessibleIds) OR i."createdById" = :userId::uuid)', { accessibleIds, userId });
    } else {
      qb.where('i."createdById" = :userId::uuid', { userId });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<IntegrationConfig> {
    const integration = await this.integrationRepository.findOne({
      where: { id },
    });
    if (!integration) {
      throw new NotFoundException(`Integration with id ${id} not found`);
    }
    return integration;
  }

  async create(dto: CreateIntegrationDto, userId: string): Promise<IntegrationConfig> {
    const integration = this.integrationRepository.create({
      type: dto.type,
      name: dto.name,
      config: dto.config,
      enabled: dto.enabled !== undefined ? dto.enabled : true,
      createdById: userId,
    });
    const saved = await this.integrationRepository.save(integration);
    await this.resourceAccessService.createCreatorAccess(ResourceType.Integration, saved.id, userId);
    return saved;
  }

  async update(
    id: string,
    dto: UpdateIntegrationDto,
  ): Promise<IntegrationConfig> {
    const integration = await this.findOne(id);
    Object.assign(integration, dto);
    return this.integrationRepository.save(integration);
  }

  async remove(id: string): Promise<void> {
    const integration = await this.findOne(id);
    await this.integrationRepository.remove(integration);
  }

  async sync(id: string): Promise<{ message: string; syncedAt: Date }> {
    const integration = await this.findOne(id);

    this.logger.log(
      `Starting sync for integration "${integration.name}" (type: ${integration.type})`,
    );

    // TODO: Implement actual sync logic per integration type
    // For now, we update the lastSyncAt timestamp
    integration.lastSyncAt = new Date();
    await this.integrationRepository.save(integration);

    return {
      message: `Sync completed for integration "${integration.name}"`,
      syncedAt: integration.lastSyncAt,
    };
  }
}
