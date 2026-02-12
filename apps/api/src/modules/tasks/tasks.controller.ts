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
import { TasksService } from './tasks.service';
import { TaskCommentsService, CreateTaskCommentDto } from './task-comments.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from '../../common/enums';
import { Task } from './entities/task.entity';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PolicyGuard)
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly commentsService: TaskCommentsService,
  ) {}

  @Get()
  @ApiQuery({ name: 'status', enum: TaskStatus, required: false })
  @ApiQuery({ name: 'assignedToId', required: false })
  @ApiQuery({ name: 'objectId', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'parentTaskId', required: false })
  @ApiQuery({ name: 'checklistId', required: false })
  @ApiQuery({ name: 'objectGroupId', required: false })
  async findAll(
    @Query('status') status?: TaskStatus,
    @Query('assignedToId') assignedToId?: string,
    @Query('objectId') objectId?: string,
    @Query('projectId') projectId?: string,
    @Query('parentTaskId') parentTaskId?: string,
    @Query('checklistId') checklistId?: string,
    @Query('objectGroupId') objectGroupId?: string,
  ): Promise<Task[]> {
    return this.tasksService.findAll({ status, assignedToId, objectId, projectId, parentTaskId, checklistId, objectGroupId });
  }

  @Post()
  async create(@Body() dto: CreateTaskDto): Promise<Task> {
    return this.tasksService.create(dto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Task> {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<Task> {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.tasksService.remove(id);
  }

  // Comments

  @Get(':id/comments')
  async getComments(@Param('id', ParseUUIDPipe) id: string) {
    return this.commentsService.findByTask(id);
  }

  @Post(':id/comments')
  async createComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTaskCommentDto,
    @CurrentUser() user: { sub: string; firstName?: string; lastName?: string; email?: string },
  ) {
    const authorName =
      [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
      user?.email ||
      user?.sub ||
      'Unknown';
    return this.commentsService.create(id, {
      content: dto.content,
      authorId: user?.sub ?? 'anonymous',
      authorName,
    });
  }

  @Delete(':taskId/comments/:commentId')
  async deleteComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ) {
    return this.commentsService.remove(commentId);
  }
}
