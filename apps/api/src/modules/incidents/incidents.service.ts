import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { Incident } from './entities/incident.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
  ) {}

  async findAll(filters?: { objectId?: string; groupId?: string }): Promise<Incident[]> {
    const where: FindOptionsWhere<Incident> = {};
    if (filters?.groupId) {
      let objectIds = await this.getObjectIdsByGroup(filters.groupId);
      if (filters?.objectId) {
        objectIds = objectIds.includes(filters.objectId) ? [filters.objectId] : [];
      }
      if (objectIds.length === 0) return [];
      where.objectId = In(objectIds);
    } else if (filters?.objectId) {
      where.objectId = filters.objectId;
    }
    return this.incidentRepository.find({
      where,
      relations: ['object'],
      order: { createdAt: 'DESC' },
    });
  }

  private async getObjectIdsByGroup(groupId: string): Promise<string[]> {
    const members = await this.incidentRepository.manager
      .createQueryBuilder()
      .select('gom.objectId')
      .from('object_group_members', 'gom')
      .where('gom.groupId = :groupId', { groupId })
      .getRawMany();
    return members.map((m: { objectId: string }) => m.objectId);
  }

  async findOne(id: string): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({
      where: { id },
      relations: ['object'],
    });
    if (!incident) {
      throw new NotFoundException(`Incident with id ${id} not found`);
    }
    return incident;
  }

  async create(dto: CreateIncidentDto): Promise<Incident> {
    const incident = this.incidentRepository.create({
      objectId: dto.objectId,
      title: dto.title,
      type: dto.type,
      severity: dto.severity,
      details: dto.details || null,
      occurredAt: new Date(dto.occurredAt),
    });
    return this.incidentRepository.save(incident);
  }

  async update(id: string, dto: UpdateIncidentDto): Promise<Incident> {
    const incident = await this.findOne(id);

    if (dto.title !== undefined) incident.title = dto.title;
    if (dto.type !== undefined) incident.type = dto.type;
    if (dto.severity !== undefined) incident.severity = dto.severity;
    if (dto.status !== undefined) incident.status = dto.status;
    if (dto.details !== undefined) incident.details = dto.details || null;
    if (dto.resolvedAt !== undefined) {
      incident.resolvedAt = dto.resolvedAt ? new Date(dto.resolvedAt) : null;
    }

    return this.incidentRepository.save(incident);
  }
}
