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
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PolicyGuard } from '../../common/guards/policy.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChecklistsService } from './checklists.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { StartChecklistRunDto } from './dto/start-checklist-run.dto';
import { UpdateRunItemDto } from './dto/update-run-item.dto';
import { Checklist } from './entities/checklist.entity';
import { ChecklistItem } from './entities/checklist-item.entity';
import { ChecklistRun } from './entities/checklist-run.entity';
import { ChecklistRunItem } from './entities/checklist-run-item.entity';

@ApiTags('checklists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PolicyGuard)
@Controller('checklists')
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: { userId: string },
  ): Promise<Checklist[]> {
    return this.checklistsService.findAll(user.userId);
  }

  @Post()
  async create(
    @Body() dto: CreateChecklistDto,
    @CurrentUser() user: { userId: string },
  ): Promise<Checklist> {
    return this.checklistsService.create(dto, user.userId);
  }

  // Static routes before parameterized ones
  @Get('references')
  async findAllReferences(): Promise<Checklist[]> {
    return this.checklistsService.findAllReferences();
  }

  @Get('by-type/:objectType')
  async findByObjectType(
    @Param('objectType') objectType: string,
  ): Promise<Checklist[]> {
    return this.checklistsService.findByObjectType(objectType);
  }

  @Post('bulk-delete')
  async removeBulk(@Body() body: { ids: string[] }): Promise<void> {
    return this.checklistsService.removeBulk(body.ids);
  }

  @Post('deduplicate-tasks/:objectId')
  async deduplicateTasks(
    @Param('objectId', ParseUUIDPipe) objectId: string,
  ): Promise<{ removed: number }> {
    const removed = await this.checklistsService.deduplicateTasks(objectId);
    return { removed };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.checklistsService.findOneWithRuns(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChecklistDto,
  ): Promise<Checklist> {
    return this.checklistsService.update(id, dto);
  }

  @Delete(':id/objects/:objectId')
  async detachObject(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('objectId', ParseUUIDPipe) objectId: string,
  ): Promise<{ deleted: number }> {
    return this.checklistsService.detachObject(id, objectId);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.checklistsService.remove(id);
  }

  // Item CRUD
  @Post(':id/items')
  async addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateChecklistItemDto,
  ): Promise<ChecklistItem> {
    return this.checklistsService.addItem(id, dto);
  }

  @Patch(':id/items/:itemId')
  async updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateChecklistItemDto,
  ): Promise<ChecklistItem> {
    return this.checklistsService.updateItem(id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  async removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<void> {
    return this.checklistsService.removeItem(id, itemId);
  }

  // Run endpoints
  @Post(':id/run')
  async startRun(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StartChecklistRunDto,
    @CurrentUser() user: { userId: string },
  ): Promise<ChecklistRun | { runs: ChecklistRun[] }> {
    if (!user?.userId) {
      throw new UnauthorizedException('User identity not found in token');
    }
    if (dto.objectGroupId) {
      return this.checklistsService.startRunForGroup(id, dto.objectGroupId, user.userId);
    }
    if (dto.objectId) {
      return this.checklistsService.startRun(id, dto.objectId, user.userId);
    }
    throw new BadRequestException('Either objectId or objectGroupId must be provided');
  }

  @Get('runs/by-object/:objectId')
  async findRunsByObject(
    @Param('objectId', ParseUUIDPipe) objectId: string,
    @Query('excludeSeeded') excludeSeeded?: string,
  ): Promise<ChecklistRun[]> {
    return this.checklistsService.findRunsByObject(objectId, excludeSeeded !== 'false');
  }

  @Get('runs/:runId')
  async findRun(
    @Param('runId', ParseUUIDPipe) runId: string,
  ): Promise<ChecklistRun> {
    return this.checklistsService.findRun(runId);
  }

  @Patch('runs/:runId/items/:itemId')
  async updateRunItem(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateRunItemDto,
  ): Promise<ChecklistRunItem> {
    return this.checklistsService.updateRunItem(runId, itemId, dto);
  }

  @Post('runs/:runId/complete')
  async completeRun(
    @Param('runId', ParseUUIDPipe) runId: string,
  ): Promise<ChecklistRun> {
    return this.checklistsService.completeRun(runId);
  }
}
