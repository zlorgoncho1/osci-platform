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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PolicyGuard } from '../../common/guards/policy.guard';
import { IntegrationsService } from './integrations.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { IntegrationConfig } from './entities/integration-config.entity';

@ApiTags('integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PolicyGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  async findAll(): Promise<IntegrationConfig[]> {
    return this.integrationsService.findAll();
  }

  @Post()
  async create(
    @Body() dto: CreateIntegrationDto,
  ): Promise<IntegrationConfig> {
    return this.integrationsService.create(dto);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IntegrationConfig> {
    return this.integrationsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIntegrationDto,
  ): Promise<IntegrationConfig> {
    return this.integrationsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.integrationsService.remove(id);
  }

  @Post(':id/sync')
  async sync(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string; syncedAt: Date }> {
    return this.integrationsService.sync(id);
  }
}
