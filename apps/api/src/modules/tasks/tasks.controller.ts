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
  @ApiQuery({ name: 'concernedUserId', required: false, description: 'Filter tasks where user is assignee, lead, or concerned' })
  async findAll(
    @CurrentUser() user: { userId: string },
    @Query('status') status?: TaskStatus,
    @Query('assignedToId') assignedToId?: string,
    @Query('objectId', new ParseUUIDPipe({ optional: true })) objectId?: string,
    @Query('projectId', new ParseUUIDPipe({ optional: true })) projectId?: string,
    @Query('parentTaskId', new ParseUUIDPipe({ optional: true })) parentTaskId?: string,
    @Query('checklistId', new ParseUUIDPipe({ optional: true })) checklistId?: string,
    @Query('objectGroupId', new ParseUUIDPipe({ optional: true })) objectGroupId?: string,
    @Query('concernedUserId', new ParseUUIDPipe({ optional: true })) concernedUserId?: string,
  ) {
    return this.tasksService.findAll(user.userId, {
      status, assignedToId, objectId, projectId, parentTaskId, checklistId, objectGroupId, concernedUserId,
    });
  }

  @Post()
  async create(
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.tasksService.create(dto, user.userId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.tasksService.remove(id);
  }

  // --- Concerned ---

  @Get(':id/concerned')
  async getConcerned(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.getConcerned(id);
  }

  @Post(':id/concerned')
  async addConcerned(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { userId?: string; userIds?: string[] },
  ) {
    const raw = body.userIds || (body.userId ? [body.userId] : []);
    const ids = raw.filter((v): v is string => typeof v === 'string' && v.length > 0);
    if (ids.length === 0) return [];
    return this.tasksService.addConcerned(id, ids);
  }

  @Delete(':id/concerned/:userId')
  async removeConcerned(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.tasksService.removeConcerned(id, userId);
  }

  // --- Comments ---

  @Get(':id/comments')
  async getComments(@Param('id', ParseUUIDPipe) id: string) {
    return this.commentsService.findByTask(id);
  }

  @Post(':id/comments')
  async createComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTaskCommentDto,
    @CurrentUser() user: { userId: string; firstName?: string; lastName?: string; email?: string },
  ) {
    const authorName =
      [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
      user?.email ||
      user?.userId ||
      'Unknown';
    return this.commentsService.create(id, {
      content: dto.content,
      authorId: user?.userId ?? 'anonymous',
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
