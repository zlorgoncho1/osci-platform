import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Score } from './entities/score.entity';
import { ChecklistRun } from '../checklists/entities/checklist-run.entity';
import { ScoringService } from './scoring.service';
import { ScoringController } from './scoring.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Score, ChecklistRun])],
  controllers: [ScoringController],
  providers: [ScoringService],
  exports: [ScoringService],
})
export class ScoringModule {}
