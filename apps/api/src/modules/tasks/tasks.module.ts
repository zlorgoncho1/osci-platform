import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TaskComment } from './entities/task-comment.entity';
import { TaskConcerned } from './entities/task-concerned.entity';
import { ChecklistRunItem } from '../checklists/entities/checklist-run-item.entity';
import { User } from '../users/entities/user.entity';
import { TasksService } from './tasks.service';
import { TaskCommentsService } from './task-comments.service';
import { TasksController } from './tasks.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskComment, TaskConcerned, ChecklistRunItem, User]),
    forwardRef(() => UsersModule),
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskCommentsService],
  exports: [TasksService],
})
export class TasksModule {}
