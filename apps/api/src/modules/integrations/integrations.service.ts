import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegrationConfig } from './entities/integration-config.entity';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    @InjectRepository(IntegrationConfig)
    private readonly integrationRepository: Repository<IntegrationConfig>,
  ) {}

  async findAll(): Promise<IntegrationConfig[]> {
    return this.integrationRepository.find({
      order: { createdAt: 'DESC' },
    });
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

  async create(dto: CreateIntegrationDto): Promise<IntegrationConfig> {
    const integration = this.integrationRepository.create({
      type: dto.type,
      name: dto.name,
      config: dto.config,
      enabled: dto.enabled !== undefined ? dto.enabled : true,
    });
    return this.integrationRepository.save(integration);
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
