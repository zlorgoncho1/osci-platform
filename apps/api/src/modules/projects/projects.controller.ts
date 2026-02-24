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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { ProjectStatus } from '../../common/enums';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PolicyGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiQuery({ name: 'status', enum: ProjectStatus, required: false })
  @ApiQuery({ name: 'ownerId', required: false })
  @ApiQuery({ name: 'concernedUserId', required: false, description: 'Filter projects where user is owner or concerned' })
  async findAll(
    @CurrentUser() user: { userId: string },
    @Query('status') status?: ProjectStatus,
    @Query('ownerId') ownerId?: string,
    @Query('concernedUserId') concernedUserId?: string,
  ) {
    return this.projectsService.findAll(user.userId, { status, ownerId, concernedUserId });
  }

  @Post()
  async create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.projectsService.create(dto, user.userId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.remove(id);
  }

  // --- Concerned ---

  @Get(':id/concerned')
  async getConcerned(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.getConcerned(id);
  }

  @Post(':id/concerned')
  async addConcerned(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { userId?: string; userIds?: string[] },
  ) {
    const raw = body.userIds || (body.userId ? [body.userId] : []);
    const ids = raw.filter((v): v is string => typeof v === 'string' && v.length > 0);
    if (ids.length === 0) return [];
    return this.projectsService.addConcerned(id, ids);
  }

  @Delete(':id/concerned/:userId')
  async removeConcerned(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.projectsService.removeConcerned(id, userId);
  }

  // --- Milestones ---

  @Post(':id/milestones')
  async createMilestone(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMilestoneDto,
  ) {
    return this.projectsService.createMilestone(id, dto);
  }

  @Patch(':id/milestones/:mid')
  async updateMilestone(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('mid', ParseUUIDPipe) mid: string,
    @Body() dto: UpdateMilestoneDto,
  ) {
    return this.projectsService.updateMilestone(id, mid, dto);
  }

  @Delete(':id/milestones/:mid')
  async removeMilestone(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('mid', ParseUUIDPipe) mid: string,
  ) {
    return this.projectsService.removeMilestone(id, mid);
  }

  // --- Project tasks ---

  @Get(':id/tasks')
  async findProjectTasks(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.findProjectTasks(id);
  }

  // --- Project stats ---

  @Get(':id/stats')
  async getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.getStats(id);
  }
}
