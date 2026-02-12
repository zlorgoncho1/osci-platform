import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere, Brackets } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export interface CreateAuditLogInput {
  action: string;
  actorId: string;
  objectType?: string | null;
  objectId?: string | null;
  decision?: string | null;
  policyRule?: string | null;
  context?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(input: CreateAuditLogInput): Promise<AuditLog> {
    const entry = this.auditLogRepository.create({
      action: input.action,
      actorId: input.actorId,
      objectType: input.objectType || null,
      objectId: input.objectId || null,
      decision: input.decision || null,
      policyRule: input.policyRule || null,
      context: input.context || null,
      ipAddress: input.ipAddress || null,
    });
    return this.auditLogRepository.save(entry);
  }

  async findAll(filters?: {
    actorId?: string;
    action?: string;
    objectType?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const useQueryBuilder = !!filters?.search?.trim();

    if (useQueryBuilder) {
      const qb = this.auditLogRepository
        .createQueryBuilder('log')
        .orderBy('log.createdAt', 'DESC')
        .skip(skip)
        .take(limit);

      if (filters?.actorId) {
        qb.andWhere('log.actorId = :actorId', { actorId: filters.actorId });
      }
      if (filters?.action) {
        qb.andWhere('log.action = :action', { action: filters.action });
      }
      if (filters?.objectType) {
        qb.andWhere('log.objectType = :objectType', { objectType: filters.objectType });
      }
      if (filters?.startDate && filters?.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        qb.andWhere('log.createdAt BETWEEN :startDate AND :endDate', {
          startDate: new Date(filters.startDate),
          endDate: end,
        });
      }
      const searchPattern = `%${filters!.search!.trim()}%`;
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('log.actorId ILIKE :search', { search: searchPattern })
            .orWhere('log.objectType ILIKE :search', { search: searchPattern })
            .orWhere('log.objectId ILIKE :search', { search: searchPattern })
            .orWhere('log.action ILIKE :search', { search: searchPattern });
        }),
      );

      const [data, total] = await qb.getManyAndCount();
      return { data, total, page, limit };
    }

    const where: FindOptionsWhere<AuditLog> = {};

    if (filters?.actorId) {
      where.actorId = filters.actorId;
    }
    if (filters?.action) {
      where.action = filters.action;
    }
    if (filters?.objectType) {
      where.objectType = filters.objectType;
    }
    if (filters?.startDate && filters?.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = Between(
        new Date(filters.startDate),
        end,
      );
    }

    const [data, total] = await this.auditLogRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async exportCsv(filters?: {
    actorId?: string;
    action?: string;
    objectType?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<string> {
    const result = await this.findAll({
      ...filters,
      page: 1,
      limit: 10000,
    });

    const headers = [
      'id',
      'action',
      'actorId',
      'objectType',
      'objectId',
      'decision',
      'policyRule',
      'ipAddress',
      'createdAt',
    ];

    const rows = result.data.map((log) =>
      [
        log.id,
        log.action,
        log.actorId,
        log.objectType || '',
        log.objectId || '',
        log.decision || '',
        log.policyRule || '',
        log.ipAddress || '',
        log.createdAt.toISOString(),
      ].join(','),
    );

    return [headers.join(','), ...rows].join('\n');
  }
}
