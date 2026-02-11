import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { Score } from '../scoring/entities/score.entity';
import { ChecklistRun } from '../checklists/entities/checklist-run.entity';
import { Incident } from '../incidents/entities/incident.entity';
import { Task } from '../tasks/entities/task.entity';
import { ReferentielsModule } from '../referentiels/referentiels.module';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, Score, ChecklistRun, Incident, Task]),
    ReferentielsModule,
  ],
  controllers: [ReportingController],
  providers: [ReportingService],
  exports: [ReportingService],
})
export class ReportingModule {}
