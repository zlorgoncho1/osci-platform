import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { Incident } from './entities/incident.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { ResourceType } from '../../common/enums';
import { AuthorizationService } from '../rbac/authorization.service';
import { ResourceAccessService } from '../rbac/resource-access.service';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    private readonly authorizationService: AuthorizationService,
    private readonly resourceAccessService: ResourceAccessService,
  ) {}

  async findAll(userId: string, filters?: { objectId?: string; groupId?: string }): Promise<Incident[]> {
    // Visibility filtering
    const accessibleIds = await this.authorizationService.getAccessibleResourceIds(userId, ResourceType.Incident);

    const qb = this.incidentRepository
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.object', 'object')
      .orderBy('i.createdAt', 'DESC');

    // Apply visibility filter
    if (accessibleIds !== 'all') {
      if (accessibleIds.length > 0) {
        qb.andWhere('(i.id IN (:...accessibleIds) OR i."createdById" = :userId::uuid)', { accessibleIds, userId });
      } else {
        qb.andWhere('i."createdById" = :userId::uuid', { userId });
      }
    }

    if (filters?.groupId) {
      const objectIds = await this.getObjectIdsByGroup(filters.groupId);
      if (filters?.objectId) {
        const filtered = objectIds.includes(filters.objectId) ? [filters.objectId] : [];
        if (filtered.length === 0) return [];
        qb.andWhere('i.objectId IN (:...objectIds)', { objectIds: filtered });
      } else {
        if (objectIds.length === 0) return [];
        qb.andWhere('i.objectId IN (:...objectIds)', { objectIds });
      }
    } else if (filters?.objectId) {
      qb.andWhere('i."objectId" = :objectId::uuid', { objectId: filters.objectId });
    }

    return qb.getMany();
  }

  /**
   * Batch count open incidents by objectIds.
   * WARNING: No RBAC filtering — caller must ensure objectIds are already
   * scoped to the user's visible resources (e.g. via getTopologyGraph).
   */
  async countOpenByObjectIds(objectIds: string[]): Promise<Record<string, number>> {
    if (objectIds.length === 0) return {};

    const results = await this.incidentRepository
      .createQueryBuilder('i')
      .select('i.objectId', 'objectId')
      .addSelect('COUNT(*)', 'count')
      .where('i.objectId IN (:...objectIds)', { objectIds })
      .andWhere("i.status = 'open'")
      .groupBy('i.objectId')
      .getRawMany();

    const counts: Record<string, number> = {};
    for (const row of results) {
      counts[row.objectId] = parseInt(row.count, 10);
    }
    return counts;
  }

  private async getObjectIdsByGroup(groupId: string): Promise<string[]> {
    const members = await this.incidentRepository.manager
      .createQueryBuilder()
      .select('gom.objectId')
      .from('object_group_members', 'gom')
      .where('gom."groupId" = :groupId::uuid', { groupId })
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

  async create(dto: CreateIncidentDto, userId: string): Promise<Incident> {
    const incident = this.incidentRepository.create({
      objectId: dto.objectId,
      title: dto.title,
      type: dto.type,
      severity: dto.severity,
      details: dto.details || null,
      occurredAt: new Date(dto.occurredAt),
      createdById: userId,
    });
    const saved = await this.incidentRepository.save(incident);
    await this.resourceAccessService.createCreatorAccess(ResourceType.Incident, saved.id, userId);
    return saved;
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
