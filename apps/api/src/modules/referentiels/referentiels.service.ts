import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Referentiel } from './entities/referentiel.entity';
import { FrameworkControl } from './entities/framework-control.entity';
import { CreateReferentielDto } from './dto/create-referentiel.dto';
import { UpdateReferentielDto } from './dto/update-referentiel.dto';
import { CreateFrameworkControlDto } from './dto/create-framework-control.dto';
import { UpdateFrameworkControlDto } from './dto/update-framework-control.dto';
import { CreateReferenceChecklistDto } from './dto/create-reference-checklist.dto';
import { ChecklistItem } from '../checklists/entities/checklist-item.entity';
import { Checklist } from '../checklists/entities/checklist.entity';
import { ChecklistType, Criticality, ChecklistItemType } from '../../common/enums';

export interface ReferentielFilters {
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ReferentielWithStats extends Referentiel {
  stats: { totalControls: number; mappedControls: number; coveragePercent: number };
}

export interface ReferentielListResult {
  data: ReferentielWithStats[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class ReferentielsService {
  constructor(
    @InjectRepository(Referentiel)
    private readonly referentielRepository: Repository<Referentiel>,
    @InjectRepository(FrameworkControl)
    private readonly controlRepository: Repository<FrameworkControl>,
    @InjectRepository(ChecklistItem)
    private readonly checklistItemRepository: Repository<ChecklistItem>,
    @InjectRepository(Checklist)
    private readonly checklistRepository: Repository<Checklist>,
  ) {}

  async findAll(filters?: ReferentielFilters): Promise<ReferentielListResult> {
    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 50, 100);
    const skip = (page - 1) * limit;

    const qb = this.referentielRepository
      .createQueryBuilder('ref')
      .leftJoinAndSelect('ref.controls', 'controls')
      .orderBy('ref.name', 'ASC')
      .skip(skip)
      .take(limit);

    if (filters?.type) {
      qb.andWhere('ref.type = :type', { type: filters.type });
    }
    if (filters?.search?.trim()) {
      qb.andWhere('ref.name ILIKE :search', {
        search: `%${filters.search.trim()}%`,
      });
    }

    const [data, total] = await qb.getManyAndCount();

    // Batch-compute stats for all referentiels in one query
    const allControlIds = data.flatMap((r) => (r.controls || []).map((c) => c.id));
    const mappedCounts = await this.getMappedCountsByControlIds(allControlIds);

    const enrichedData = data.map((ref) => {
      const controlIds = (ref.controls || []).map((c) => c.id);
      const totalControls = controlIds.length;
      const mappedControlIds = controlIds.filter((id) => (mappedCounts[id] || 0) > 0);
      const mappedControls = mappedControlIds.length;
      const coveragePercent = totalControls > 0
        ? Math.round((mappedControls / totalControls) * 10000) / 100
        : 0;
      return Object.assign(ref, {
        stats: { totalControls, mappedControls, coveragePercent },
      }) as ReferentielWithStats;
    });

    return { data: enrichedData, total, page, limit };
  }

  async findOne(id: string): Promise<Referentiel> {
    const referentiel = await this.referentielRepository.findOne({
      where: { id },
      relations: ['controls', 'controls.parent', 'controls.children'],
      order: { controls: { orderIndex: 'ASC' } },
    });
    if (!referentiel) {
      throw new NotFoundException(`Referentiel with id ${id} not found`);
    }
    return referentiel;
  }

  async create(dto: CreateReferentielDto): Promise<Referentiel> {
    const referentiel = this.referentielRepository.create({
      code: dto.code,
      name: dto.name,
      description: dto.description || null,
      version: dto.version || '1.0',
      type: dto.type,
      domain: dto.domain || null,
      metadata: dto.metadata || null,
    });
    return this.referentielRepository.save(referentiel);
  }

  async update(id: string, dto: UpdateReferentielDto): Promise<Referentiel> {
    const referentiel = await this.findOne(id);
    if (dto.code !== undefined) referentiel.code = dto.code;
    if (dto.name !== undefined) referentiel.name = dto.name;
    if (dto.description !== undefined) referentiel.description = dto.description || null;
    if (dto.version !== undefined) referentiel.version = dto.version;
    if (dto.type !== undefined) referentiel.type = dto.type;
    if (dto.domain !== undefined) referentiel.domain = dto.domain;
    if (dto.metadata !== undefined) referentiel.metadata = dto.metadata;
    return this.referentielRepository.save(referentiel);
  }

  async remove(id: string): Promise<void> {
    const referentiel = await this.findOne(id);
    await this.checklistRepository.update({ referentielId: id }, { referentielId: null });
    await this.referentielRepository.remove(referentiel);
  }

  async findControlsByReferentiel(referentielId: string): Promise<FrameworkControl[]> {
    await this.findOne(referentielId);
    return this.controlRepository.find({
      where: { referentielId },
      relations: ['parent', 'children'],
      order: { orderIndex: 'ASC', code: 'ASC' },
    });
  }

  async findControl(referentielId: string, controlId: string): Promise<FrameworkControl> {
    const control = await this.controlRepository.findOne({
      where: { id: controlId, referentielId },
      relations: ['referentiel', 'parent', 'children'],
    });
    if (!control) {
      throw new NotFoundException(
        `Control ${controlId} not found in referentiel ${referentielId}`,
      );
    }
    return control;
  }

  async createControl(
    referentielId: string,
    dto: CreateFrameworkControlDto,
  ): Promise<FrameworkControl> {
    await this.findOne(referentielId);
    const control = this.controlRepository.create({
      referentielId,
      code: dto.code,
      title: dto.title,
      description: dto.description || null,
      parentControlId: dto.parentControlId || null,
      orderIndex: dto.orderIndex ?? 0,
      metadata: dto.metadata || null,
    });
    return this.controlRepository.save(control);
  }

  async updateControl(
    referentielId: string,
    controlId: string,
    dto: UpdateFrameworkControlDto,
  ): Promise<FrameworkControl> {
    const control = await this.findControl(referentielId, controlId);
    if (dto.code !== undefined) control.code = dto.code;
    if (dto.title !== undefined) control.title = dto.title;
    if (dto.description !== undefined) control.description = dto.description || null;
    if (dto.parentControlId !== undefined) control.parentControlId = dto.parentControlId || null;
    if (dto.orderIndex !== undefined) control.orderIndex = dto.orderIndex;
    if (dto.metadata !== undefined) control.metadata = dto.metadata;
    return this.controlRepository.save(control);
  }

  async removeControl(referentielId: string, controlId: string): Promise<void> {
    const control = await this.findControl(referentielId, controlId);
    await this.controlRepository.remove(control);
  }

  async getMappedChecklistItems(controlId: string): Promise<ChecklistItem[]> {
    return this.checklistItemRepository.find({
      where: { frameworkControlId: controlId },
      relations: ['checklist'],
      order: { orderIndex: 'ASC' },
    });
  }

  async getMappedCountsByReferentiel(referentielId: string): Promise<Record<string, number>> {
    // Validate referentiel exists
    const exists = await this.referentielRepository.count({ where: { id: referentielId } });
    if (exists === 0) {
      throw new NotFoundException(`Referentiel with id ${referentielId} not found`);
    }
    // Lightweight query: only fetch control IDs, no parent/children relations
    const controls = await this.controlRepository.find({
      where: { referentielId },
      select: ['id'],
    });
    const controlIds = controls.map((c) => c.id);
    if (controlIds.length === 0) return {};

    const results = await this.checklistItemRepository
      .createQueryBuilder('item')
      .select('item.frameworkControlId', 'controlId')
      .addSelect('COUNT(*)', 'count')
      .where('item.frameworkControlId IN (:...controlIds)', { controlIds })
      .groupBy('item.frameworkControlId')
      .getRawMany();

    const counts: Record<string, number> = {};
    for (const row of results) {
      counts[row.controlId] = parseInt(row.count, 10);
    }
    return counts;
  }

  async getMappedCountsByControlIds(controlIds: string[]): Promise<Record<string, number>> {
    if (controlIds.length === 0) return {};

    const results = await this.checklistItemRepository
      .createQueryBuilder('item')
      .select('item.frameworkControlId', 'controlId')
      .addSelect('COUNT(*)', 'count')
      .where('item.frameworkControlId IN (:...controlIds)', { controlIds })
      .groupBy('item.frameworkControlId')
      .getRawMany();

    const counts: Record<string, number> = {};
    for (const row of results) {
      counts[row.controlId] = parseInt(row.count, 10);
    }
    return counts;
  }

  async findChecklistsByReferentiel(referentielId: string): Promise<Checklist[]> {
    await this.findOne(referentielId);

    return this.checklistRepository.find({
      where: { isReference: true, referentielId },
      relations: ['items'],
      order: { title: 'ASC' },
    });
  }

  async createReferenceChecklist(
    referentielId: string,
    dto: CreateReferenceChecklistDto,
  ): Promise<Checklist> {
    await this.findOne(referentielId);

    const checklist = this.checklistRepository.create({
      title: dto.title,
      version: dto.version || '1.0',
      domain: dto.domain,
      checklistType: dto.checklistType || ChecklistType.Compliance,
      criticality: dto.criticality,
      applicability: dto.applicability,
      description: dto.description || null,
      isReference: true,
      referentielId,
    });

    const savedChecklist = await this.checklistRepository.save(checklist);

    const items = dto.items || [];
    for (let i = 0; i < items.length; i++) {
      const itemDto = items[i];
      const item = this.checklistItemRepository.create({
        checklistId: savedChecklist.id,
        question: itemDto.question,
        itemType: itemDto.itemType,
        weight: itemDto.weight ?? 1.0,
        expectedEvidence: itemDto.expectedEvidence || null,
        referenceType: itemDto.referenceType || null,
        reference: itemDto.reference || null,
        frameworkControlId: itemDto.frameworkControlId || null,
        orderIndex: itemDto.orderIndex ?? i,
        autoTaskTitle: itemDto.autoTaskTitle || null,
      });
      await this.checklistItemRepository.save(item);
    }

    return this.checklistRepository.findOneOrFail({
      where: { id: savedChecklist.id },
      relations: ['items', 'referentiel'],
    });
  }

  async getComplianceStats(referentielId: string): Promise<{
    totalControls: number;
    mappedControls: number;
    coveragePercent: number;
  }> {
    const referentiel = await this.findOne(referentielId);
    const totalControls = referentiel.controls?.length || 0;
    if (totalControls === 0) {
      return { totalControls: 0, mappedControls: 0, coveragePercent: 0 };
    }

    const controlIds = referentiel.controls!.map((c) => c.id);
    const mappedControlIds = new Set<string>();
    const items = await this.checklistItemRepository.find({
      where: { frameworkControlId: In(controlIds) },
      select: ['frameworkControlId'],
    });
    items.forEach((i) => {
      if (i.frameworkControlId) mappedControlIds.add(i.frameworkControlId);
    });

    const coveragePercent =
      totalControls > 0 ? (mappedControlIds.size / totalControls) * 100 : 0;

    return {
      totalControls,
      mappedControls: mappedControlIds.size,
      coveragePercent: Math.round(coveragePercent * 100) / 100,
    };
  }

  async importFromChecklist(
    referentielId: string,
    checklistId: string,
  ): Promise<{ imported: number }> {
    await this.findOne(referentielId);
    const checklist = await this.checklistRepository.findOne({
      where: { id: checklistId },
      relations: ['items'],
    });
    if (!checklist) {
      throw new NotFoundException(`Checklist ${checklistId} not found`);
    }
    let orderIndex = 0;
    const existing = await this.controlRepository.count({ where: { referentielId } });
    orderIndex = existing;
    const items = (checklist.items || []).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    let imported = 0;
    for (const item of items) {
      const control = this.controlRepository.create({
        referentielId,
        code: item.reference || `Q${orderIndex + 1}`,
        title: item.question,
        description: item.expectedEvidence || null,
        orderIndex,
      });
      await this.controlRepository.save(control);
      orderIndex++;
      imported++;
    }
    return { imported };
  }

  async importFromReferentiel(
    targetId: string,
    sourceReferentielId: string,
  ): Promise<{ imported: number }> {
    await this.findOne(targetId);
    const source = await this.findOne(sourceReferentielId);
    if (source.id === targetId) {
      throw new NotFoundException('Cannot copy from same referentiel');
    }
    let orderIndex = 0;
    const existing = await this.controlRepository.count({ where: { referentielId: targetId } });
    orderIndex = existing;
    let imported = 0;
    for (const ctrl of source.controls || []) {
      const control = this.controlRepository.create({
        referentielId: targetId,
        code: ctrl.code,
        title: ctrl.title,
        description: ctrl.description || null,
        orderIndex,
      });
      await this.controlRepository.save(control);
      orderIndex++;
      imported++;
    }
    return { imported };
  }

  async createChecklistFromReferentiel(
    referentielId: string,
    dto: { title: string; domain?: string },
  ): Promise<Checklist> {
    const referentiel = await this.findOne(referentielId);
    const domain = (dto.domain || referentiel.domain || 'Governance') as import('../../common/enums').ChecklistDomain;
    const checklist = this.checklistRepository.create({
      title: (dto.title && dto.title.trim()) ? dto.title.trim() : `${referentiel.name} - Checklist`,
      version: '1.0',
      domain,
      checklistType: ChecklistType.Compliance,
      criticality: Criticality.High,
      applicability: ['Project', 'Infrastructure'],
      description: `Checklist basée sur le référentiel ${referentiel.name}`,
      isReference: false,
    });
    const savedChecklist = await this.checklistRepository.save(checklist);
    const controls = (referentiel.controls || []).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    for (let i = 0; i < controls.length; i++) {
      const ctrl = controls[i];
      const item = this.checklistItemRepository.create({
        checklistId: savedChecklist.id,
        question: ctrl.title,
        itemType: ChecklistItemType.YesNo,
        weight: 1.0,
        frameworkControlId: ctrl.id,
        orderIndex: i,
      });
      await this.checklistItemRepository.save(item);
    }
    return this.checklistRepository.findOneOrFail({
      where: { id: savedChecklist.id },
      relations: ['items'],
    });
  }
}
