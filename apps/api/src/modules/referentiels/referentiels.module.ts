import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Referentiel } from './entities/referentiel.entity';
import { FrameworkControl } from './entities/framework-control.entity';
import { ChecklistItem } from '../checklists/entities/checklist-item.entity';
import { Checklist } from '../checklists/entities/checklist.entity';
import { ReferentielsService } from './referentiels.service';
import { CommunityReferentielsService } from './community-referentiels.service';
import { ReferentielsController } from './referentiels.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Referentiel, FrameworkControl, ChecklistItem, Checklist]),
    HttpModule,
  ],
  controllers: [ReferentielsController],
  providers: [ReferentielsService, CommunityReferentielsService],
  exports: [ReferentielsService],
})
export class ReferentielsModule {}
