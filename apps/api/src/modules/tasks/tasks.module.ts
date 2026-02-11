import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TaskComment } from './entities/task-comment.entity';
import { ChecklistRunItem } from '../checklists/entities/checklist-run-item.entity';
import { TasksService } from './tasks.service';
import { TaskCommentsService } from './task-comments.service';
import { TasksController } from './tasks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskComment, ChecklistRunItem])],
  controllers: [TasksController],
  providers: [TasksService, TaskCommentsService],
  exports: [TasksService],
})
export class TasksModule {}
