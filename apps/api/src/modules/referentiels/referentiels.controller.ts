import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PolicyGuard } from '../../common/guards/policy.guard';
import { ReferentielsService, ReferentielListResult } from './referentiels.service';
import { CommunityReferentielsService, CommunityReferentielSummary, ImportResult, ImportChecklistResult } from './community-referentiels.service';
import { CreateReferentielDto } from './dto/create-referentiel.dto';
import { UpdateReferentielDto } from './dto/update-referentiel.dto';
import { CreateFrameworkControlDto } from './dto/create-framework-control.dto';
import { UpdateFrameworkControlDto } from './dto/update-framework-control.dto';
import { CreateReferenceChecklistDto } from './dto/create-reference-checklist.dto';
import { Referentiel } from './entities/referentiel.entity';
import { FrameworkControl } from './entities/framework-control.entity';
import { Checklist } from '../checklists/entities/checklist.entity';
import { ChecklistItem } from '../checklists/entities/checklist-item.entity';

@ApiTags('referentiels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PolicyGuard)
@Controller('referentiels')
export class ReferentielsController {
  constructor(
    private readonly referentielsService: ReferentielsService,
    private readonly communityService: CommunityReferentielsService,
  ) {}

  @Get()
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ReferentielListResult> {
    return this.referentielsService.findAll({
      type,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post()
  async create(@Body() dto: CreateReferentielDto): Promise<Referentiel> {
    return this.referentielsService.create(dto);
  }

  @Get('community')
  async listCommunity(): Promise<CommunityReferentielSummary[]> {
    return this.communityService.listAvailable();
  }

  @Post('community/import')
  async importCommunity(@Body() body: { folder: string }): Promise<ImportResult> {
    return this.communityService.importFromGithub(body.folder);
  }

  @Post('community/import-checklist')
  async importCommunityChecklist(
    @Body() body: { folder: string; checklistIndex: number },
  ): Promise<ImportChecklistResult> {
    return this.communityService.importChecklistFromGithub(body.folder, body.checklistIndex);
  }

  @Get(':id/checklists')
  async getChecklists(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Checklist[]> {
    return this.referentielsService.findChecklistsByReferentiel(id);
  }

  @Post(':id/checklists')
  async createReferenceChecklist(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReferenceChecklistDto,
  ): Promise<Checklist> {
    return this.referentielsService.createReferenceChecklist(id, dto);
  }

  @Get(':id/stats')
  async getStats(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ totalControls: number; mappedControls: number; coveragePercent: number }> {
    return this.referentielsService.getComplianceStats(id);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Referentiel> {
    return this.referentielsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReferentielDto,
  ): Promise<Referentiel> {
    return this.referentielsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.referentielsService.remove(id);
  }

  @Get(':id/controls')
  async findControls(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FrameworkControl[]> {
    return this.referentielsService.findControlsByReferentiel(id);
  }

  @Post(':id/controls')
  async createControl(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateFrameworkControlDto,
  ): Promise<FrameworkControl> {
    return this.referentielsService.createControl(id, dto);
  }

  @Get(':id/controls/:controlId')
  async findControl(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('controlId', ParseUUIDPipe) controlId: string,
  ): Promise<FrameworkControl> {
    return this.referentielsService.findControl(id, controlId);
  }

  @Patch(':id/controls/:controlId')
  async updateControl(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('controlId', ParseUUIDPipe) controlId: string,
    @Body() dto: UpdateFrameworkControlDto,
  ): Promise<FrameworkControl> {
    return this.referentielsService.updateControl(id, controlId, dto);
  }

  @Delete(':id/controls/:controlId')
  async removeControl(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('controlId', ParseUUIDPipe) controlId: string,
  ): Promise<void> {
    return this.referentielsService.removeControl(id, controlId);
  }

  @Get(':id/controls/:controlId/mapped-items')
  async getMappedItems(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('controlId', ParseUUIDPipe) controlId: string,
  ): Promise<ChecklistItem[]> {
    await this.referentielsService.findControl(id, controlId);
    return this.referentielsService.getMappedChecklistItems(controlId);
  }

  @Post(':id/create-checklist')
  async createChecklist(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { title?: string; domain?: string },
  ): Promise<Checklist> {
    return this.referentielsService.createChecklistFromReferentiel(id, {
      title: body.title || '',
      domain: body.domain,
    });
  }

  @Post(':id/import-from-checklist')
  async importFromChecklist(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { checklistId: string },
  ): Promise<{ imported: number }> {
    return this.referentielsService.importFromChecklist(id, body.checklistId);
  }

  @Post(':id/import-from-referentiel')
  async importFromReferentiel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { sourceReferentielId: string },
  ): Promise<{ imported: number }> {
    return this.referentielsService.importFromReferentiel(id, body.sourceReferentielId);
  }
}
