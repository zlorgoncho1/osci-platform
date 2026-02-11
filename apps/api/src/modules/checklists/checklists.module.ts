import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Checklist } from './entities/checklist.entity';
import { ChecklistItem } from './entities/checklist-item.entity';
import { ChecklistRun } from './entities/checklist-run.entity';
import { ChecklistRunItem } from './entities/checklist-run-item.entity';
import { Task } from '../tasks/entities/task.entity';
import { FrameworkControl } from '../referentiels/entities/framework-control.entity';
import { ChecklistsService } from './checklists.service';
import { ChecklistsController } from './checklists.controller';
import { ScoringModule } from '../scoring/scoring.module';
import { ObjectGroupsModule } from '../object-groups/object-groups.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Checklist,
      ChecklistItem,
      ChecklistRun,
      ChecklistRunItem,
      Task,
      FrameworkControl,
    ]),
    ScoringModule,
    ObjectGroupsModule,
  ],
  controllers: [ChecklistsController],
  providers: [ChecklistsService],
  exports: [ChecklistsService],
})
export class ChecklistsModule {}
