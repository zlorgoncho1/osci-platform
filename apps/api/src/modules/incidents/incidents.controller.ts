import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PolicyGuard } from '../../common/guards/policy.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { Incident } from './entities/incident.entity';

@ApiTags('incidents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PolicyGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: { userId: string },
    @Query('objectId', new ParseUUIDPipe({ optional: true })) objectId?: string,
    @Query('groupId', new ParseUUIDPipe({ optional: true })) groupId?: string,
  ): Promise<Incident[]> {
    return this.incidentsService.findAll(user.userId, { objectId, groupId });
  }

  @Post()
  async create(
    @Body() dto: CreateIncidentDto,
    @CurrentUser() user: { userId: string },
  ): Promise<Incident> {
    return this.incidentsService.create(dto, user.userId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Incident> {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIncidentDto,
  ): Promise<Incident> {
    return this.incidentsService.update(id, dto);
  }
}
