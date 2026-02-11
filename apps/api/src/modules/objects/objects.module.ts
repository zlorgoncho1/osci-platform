import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecObject } from './entities/object.entity';
import { ObjectsService } from './objects.service';
import { ObjectsController } from './objects.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SecObject])],
  controllers: [ObjectsController],
  providers: [ObjectsService],
  exports: [ObjectsService],
})
export class ObjectsModule {}
