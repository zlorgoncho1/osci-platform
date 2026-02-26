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
import { PolicyGuard } from '../../common/guards/policy.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ObjectsService } from './objects.service';
import { CreateObjectDto } from './dto/create-object.dto';
import { UpdateObjectDto } from './dto/update-object.dto';
import { ObjectType } from '../../common/enums';
import { SecObject } from './entities/object.entity';

@ApiTags('objects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PolicyGuard)
@Controller('objects')
export class ObjectsController {
  constructor(private readonly objectsService: ObjectsService) {}

  @Get()
  @ApiQuery({ name: 'type', enum: ObjectType, required: false })
  @ApiQuery({ name: 'parentId', required: false })
  async findAll(
    @CurrentUser() user: { userId: string },
    @Query('type') type?: ObjectType,
    @Query('parentId', new ParseUUIDPipe({ optional: true })) parentId?: string,
  ): Promise<SecObject[]> {
    return this.objectsService.findAll(user.userId, { type, parentId });
  }

  @Post()
  async create(
    @Body() dto: CreateObjectDto,
    @CurrentUser() user: { userId: string },
  ): Promise<SecObject> {
    return this.objectsService.create(dto, user.userId);
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
