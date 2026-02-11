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
import { ObjectsService } from './objects.service';
import { CreateObjectDto } from './dto/create-object.dto';
import { UpdateObjectDto } from './dto/update-object.dto';
import { ObjectType } from '../../common/enums';
import { SecObject } from './entities/object.entity';

@ApiTags('objects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('objects')
export class ObjectsController {
  constructor(private readonly objectsService: ObjectsService) {}

  @Get()
  @ApiQuery({ name: 'type', enum: ObjectType, required: false })
  @ApiQuery({ name: 'parentId', required: false })
  async findAll(
    @Query('type') type?: ObjectType,
    @Query('parentId') parentId?: string,
  ): Promise<SecObject[]> {
    return this.objectsService.findAll({ type, parentId });
  }

  @Post()
  async create(@Body() dto: CreateObjectDto): Promise<SecObject> {
    return this.objectsService.create(dto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SecObject> {
    return this.objectsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateObjectDto,
  ): Promise<SecObject> {
    return this.objectsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.objectsService.remove(id);
  }
}
