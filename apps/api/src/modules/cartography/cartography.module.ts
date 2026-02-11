import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from './entities/asset.entity';
import { Relation } from './entities/relation.entity';
import { CartographyService } from './cartography.service';
import { CartographyController } from './cartography.controller';
import { IncidentsModule } from '../incidents/incidents.module';
import { ScoringModule } from '../scoring/scoring.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asset, Relation]),
    IncidentsModule,
    ScoringModule,
  ],
  controllers: [CartographyController],
  providers: [CartographyService],
  exports: [CartographyService],
})
export class CartographyModule {}
