import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ObjectGroupsService } from './object-groups.service';
import { CreateObjectGroupDto } from './dto/create-object-group.dto';
import { UpdateObjectGroupDto } from './dto/update-object-group.dto';
import { ManageGroupMembersDto } from './dto/manage-group-members.dto';
import { ObjectGroup } from './entities/object-group.entity';

@ApiTags('object-groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('object-groups')
export class ObjectGroupsController {
  constructor(private readonly objectGroupsService: ObjectGroupsService) {}

  @Get()
  async findAll(): Promise<ObjectGroup[]> {
    return this.objectGroupsService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateObjectGroupDto): Promise<ObjectGroup> {
    return this.objectGroupsService.create(dto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ObjectGroup> {
    return this.objectGroupsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateObjectGroupDto,
  ): Promise<ObjectGroup> {
    return this.objectGroupsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.objectGroupsService.remove(id);
  }

  @Post(':id/members')
  async addMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ManageGroupMembersDto,
  ): Promise<ObjectGroup> {
    return this.objectGroupsService.addMembers(id, dto.objectIds);
  }

  @Delete(':id/members')
  async removeMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ManageGroupMembersDto,
  ): Promise<ObjectGroup> {
    return this.objectGroupsService.removeMembers(id, dto.objectIds);
  }

  @Get(':id/score')
  async getGroupScore(@Param('id', ParseUUIDPipe) id: string) {
    return this.objectGroupsService.getGroupScore(id);
  }
}
