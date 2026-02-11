import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObjectGroup } from './entities/object-group.entity';
import { SecObject } from '../objects/entities/object.entity';
import { ObjectGroupsService } from './object-groups.service';
import { ObjectGroupsController } from './object-groups.controller';
import { ScoringModule } from '../scoring/scoring.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ObjectGroup, SecObject]),
    ScoringModule,
  ],
  controllers: [ObjectGroupsController],
  providers: [ObjectGroupsService],
  exports: [ObjectGroupsService],
})
export class ObjectGroupsModule {}
