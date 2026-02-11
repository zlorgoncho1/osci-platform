import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Not, Repository } from 'typeorm';
import { Checklist } from './entities/checklist.entity';
import { ChecklistItem } from './entities/checklist-item.entity';
import { ChecklistRun } from './entities/checklist-run.entity';
import { ChecklistRunItem } from './entities/checklist-run-item.entity';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { UpdateRunItemDto } from './dto/update-run-item.dto';
import { RunStatus, RunItemStatus, ChecklistType, Criticality, TaskStatus } from '../../common/enums';
import { ReferenceType } from '../../common/enums';
import { ReferentielType } from '../../common/enums';
import { Task } from '../tasks/entities/task.entity';
import { FrameworkControl } from '../referentiels/entities/framework-control.entity';
import { ScoringService } from '../scoring/scoring.service';
import { ObjectGroupsService } from '../object-groups/object-groups.service';

@Injectable()
export class ChecklistsService {
  constructor(
    @InjectRepository(Checklist)
    private readonly checklistRepository: Repository<Checklist>,
    @InjectRepository(ChecklistItem)
    private readonly checklistItemRepository: Repository<ChecklistItem>,
    @InjectRepository(ChecklistRun)
    private readonly checklistRunRepository: Repository<ChecklistRun>,
    @InjectRepository(ChecklistRunItem)
    private readonly checklistRunItemRepository: Repository<ChecklistRunItem>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(FrameworkControl)
    private readonly frameworkControlRepository: Repository<FrameworkControl>,
    private readonly scoringService: ScoringService,
    private readonly objectGroupsService: ObjectGroupsService,
  ) {}

  async findAll(): Promise<Checklist[]> {
    return this.checklistRepository.find({
      where: { isReference: false },
      relations: ['items', 'items.frameworkControl'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllReferences(): Promise<Checklist[]> {
    return this.checklistRepository.find({
      where: { isReference: true },
      relations: ['items', 'items.frameworkControl', 'referentiel'],
      order: { domain: 'ASC', title: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Checklist> {
    const checklist = await this.checklistRepository.findOne({
      where: { id },
      relations: ['items', 'items.frameworkControl', 'items.frameworkControl.referentiel'],
    });
    if (!checklist) {
      throw new NotFoundException(`Checklist with id ${id} not found`);
    }
    return checklist;
  }

  async create(dto: CreateChecklistDto): Promise<Checklist> {
    const checklist = this.checklistRepository.create({
      title: dto.title,
      version: dto.version || '1.0',
      domain: dto.domain,
      checklistType: dto.checklistType || ChecklistType.Compliance,
      criticality: dto.criticality,
      applicability: dto.applicability,
      description: dto.description || null,
      items: await Promise.all(
        dto.items.map(async (itemDto, index) => {
          const { referenceType, reference } = await this.resolveReferenceFromControl(
            itemDto.frameworkControlId,
            itemDto.referenceType,
            itemDto.reference,
          );
          return this.checklistItemRepository.create({
            question: itemDto.question,
            itemType: itemDto.itemType,
            weight: itemDto.weight ?? 1.0,
            expectedEvidence: itemDto.expectedEvidence || null,
            referenceType,
            reference,
            frameworkControlId: itemDto.frameworkControlId || null,
            orderIndex: itemDto.orderIndex ?? index,
            autoTaskTitle: itemDto.autoTaskTitle || null,
          });
        }),
      ),
    });

    return this.checklistRepository.save(checklist);
  }

  async startRun(
    checklistId: string,
    objectId: string,
    executedById: string,
  ): Promise<ChecklistRun> {
    const checklist = await this.findOne(checklistId);

    const run = this.checklistRunRepository.create({
      checklistId: checklist.id,
      objectId,
      executedById,
      status: RunStatus.InProgress,
      items: checklist.items.map((item) =>
        this.checklistRunItemRepository.create({
          checklistItemId: item.id,
          status: RunItemStatus.Pending,
        }),
      ),
    });

    return this.checklistRunRepository.save(run);
  }

  async startRunForGroup(
    checklistId: string,
    objectGroupId: string,
    executedById: string,
  ): Promise<{ runs: ChecklistRun[] }> {
    const checklist = await this.findOne(checklistId);
    const group = await this.objectGroupsService.findOne(objectGroupId);

    const objectIds = group.objects
      .filter((obj) =>
        Array.isArray(checklist.applicability) && checklist.applicability.length > 0
          ? checklist.applicability.includes(obj.type)
          : true,
      )
      .map((obj) => obj.id);

    if (objectIds.length === 0) {
      return { runs: [] };
    }

    const runs: ChecklistRun[] = [];
    for (const objectId of objectIds) {
      const run = await this.startRun(checklistId, objectId, executedById);
      runs.push(run);
    }

    return { runs };
  }

  async findRun(runId: string): Promise<ChecklistRun> {
    const run = await this.checklistRunRepository.findOne({
      where: { id: runId },
      relations: ['items', 'items.checklistItem', 'items.checklistItem.frameworkControl', 'checklist', 'object'],
    });
    if (!run) {
      throw new NotFoundException(`Checklist run with id ${runId} not found`);
    }
    return run;
  }

  async updateRunItem(
    runId: string,
    itemId: string,
    dto: UpdateRunItemDto,
  ): Promise<ChecklistRunItem> {
    const runItem = await this.checklistRunItemRepository.findOne({
      where: { id: itemId, checklistRunId: runId },
      relations: ['checklistItem', 'checklistRun'],
    });

    if (!runItem) {
      throw new NotFoundException(
        `Run item ${itemId} not found in run ${runId}`,
      );
    }

    if (dto.status !== undefined) {
      runItem.status = dto.status;
    }
    if (dto.answer !== undefined) {
      runItem.answer = dto.answer;
    }
    if (dto.notes !== undefined) {
      runItem.notes = dto.notes;
    }
    if (dto.score !== undefined) {
      runItem.score = dto.score;
    }

    const savedItem = await this.checklistRunItemRepository.save(runItem);

    // Smart task management on status changes
    if (
      dto.status === RunItemStatus.NonConformant ||
      dto.status === RunItemStatus.Conformant
    ) {
      const run = await this.checklistRunRepository.findOne({
        where: { id: runId },
      });

      if (run) {
        // Find existing task for the same checklist item + object across ALL runs
        const relatedRunItems = await this.checklistRunItemRepository
          .createQueryBuilder('ri')
          .innerJoin('ri.checklistRun', 'cr')
          .where('cr.objectId = :objectId', { objectId: run.objectId })
          .andWhere('ri.checklistItemId = :checklistItemId', {
            checklistItemId: runItem.checklistItemId,
          })
          .select('ri.id')
          .getRawMany();

        const relatedIds = relatedRunItems.map((r: any) => r.ri_id);

        let existingTask: Task | null = null;
        if (relatedIds.length > 0) {
          existingTask = await this.taskRepository.findOne({
            where: {
              objectId: run.objectId,
              checklistRunItemId: In(relatedIds),
            },
          });
        }

        if (dto.status === RunItemStatus.NonConformant) {
          if (existingTask) {
            // Task exists - only reset to ToDo if it was previously Done (regression)
            if (existingTask.status === TaskStatus.Done) {
              existingTask.status = TaskStatus.ToDo;
              existingTask.checklistRunItemId = itemId;
              await this.taskRepository.save(existingTask);
            }
            // Otherwise keep current status (InProgress, Review, ToDo, etc.)
          } else {
            // No existing task - create a new one
            const checklistItem = await this.checklistItemRepository.findOne({
              where: { id: runItem.checklistItemId },
            });

            if (checklistItem) {
              const taskTitle =
                checklistItem.autoTaskTitle ||
                `Fix: ${checklistItem.question}`;

              const task = this.taskRepository.create({
                objectId: run.objectId,
                checklistRunItemId: itemId,
                title: taskTitle,
                description: `Auto-created from checklist run. Question: ${checklistItem.question}`,
                status: TaskStatus.ToDo,
                priority: Criticality.Medium,
              });
              await this.taskRepository.save(task);
            }
          }
        } else if (dto.status === RunItemStatus.Conformant) {
          // Item is now conformant - mark existing task as Done
          if (existingTask && existingTask.status !== TaskStatus.Done) {
            existingTask.status = TaskStatus.Done;
            existingTask.checklistRunItemId = itemId;
            await this.taskRepository.save(existingTask);
          }
        }
      }
    }

    // Recalculate run score
    await this.recalculateRunScore(runId);

    return savedItem;
  }

  async update(id: string, dto: UpdateChecklistDto): Promise<Checklist> {
    const checklist = await this.findOne(id);
    if (dto.title !== undefined) checklist.title = dto.title;
    if (dto.version !== undefined) checklist.version = dto.version;
    if (dto.domain !== undefined) checklist.domain = dto.domain;
    if (dto.checklistType !== undefined) checklist.checklistType = dto.checklistType;
    if (dto.criticality !== undefined) checklist.criticality = dto.criticality;
    if (dto.applicability !== undefined) checklist.applicability = dto.applicability;
    if (dto.description !== undefined) checklist.description = dto.description || null;
    return this.checklistRepository.save(checklist);
  }

  async remove(id: string): Promise<void> {
    const checklist = await this.findOne(id);
    await this.checklistRepository.remove(checklist);
  }

  async removeBulk(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;
    const checklists = await this.checklistRepository.find({
      where: { id: In(ids) },
    });
    if (checklists.length > 0) {
      await this.checklistRepository.remove(checklists);
    }
  }

  async findByObjectType(objectType: string): Promise<Checklist[]> {
    const all = await this.checklistRepository.find({
      where: { isReference: false },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
    return all.filter(
      (cl) =>
        Array.isArray(cl.applicability) &&
        cl.applicability.includes(objectType),
    );
  }

  async findOneWithRuns(id: string): Promise<Checklist & { runs: ChecklistRun[] }> {
    const checklist = await this.findOne(id);
    const runs = await this.checklistRunRepository.find({
      where: { checklistId: id },
      relations: ['object'],
      order: { createdAt: 'DESC' },
    });
    return Object.assign(checklist, { runs });
  }

  async addItem(checklistId: string, dto: CreateChecklistItemDto): Promise<ChecklistItem> {
    await this.findOne(checklistId);
    const { referenceType, reference } = await this.resolveReferenceFromControl(
      dto.frameworkControlId,
      dto.referenceType,
      dto.reference,
    );
    const item = this.checklistItemRepository.create({
      checklistId,
      question: dto.question,
      itemType: dto.itemType,
      weight: dto.weight ?? 1.0,
      expectedEvidence: dto.expectedEvidence || null,
      referenceType,
      reference,
      frameworkControlId: dto.frameworkControlId || null,
      orderIndex: dto.orderIndex ?? 0,
      autoTaskTitle: dto.autoTaskTitle || null,
    });
    return this.checklistItemRepository.save(item);
  }

  async updateItem(
    checklistId: string,
    itemId: string,
    dto: UpdateChecklistItemDto,
  ): Promise<ChecklistItem> {
    const item = await this.checklistItemRepository.findOne({
      where: { id: itemId, checklistId },
    });
    if (!item) {
      throw new NotFoundException(
        `Checklist item ${itemId} not found in checklist ${checklistId}`,
      );
    }
    if (dto.question !== undefined) item.question = dto.question;
    if (dto.itemType !== undefined) item.itemType = dto.itemType;
    if (dto.weight !== undefined) item.weight = dto.weight;
    if (dto.expectedEvidence !== undefined) item.expectedEvidence = dto.expectedEvidence || null;
    if (dto.orderIndex !== undefined) item.orderIndex = dto.orderIndex;
    if (dto.autoTaskTitle !== undefined) item.autoTaskTitle = dto.autoTaskTitle || null;
    if (dto.frameworkControlId !== undefined) {
      item.frameworkControlId = dto.frameworkControlId || null;
      const { referenceType, reference } = await this.resolveReferenceFromControl(
        dto.frameworkControlId,
        dto.referenceType,
        dto.reference,
      );
      item.referenceType = referenceType;
      item.reference = reference;
    } else {
      if (dto.referenceType !== undefined) item.referenceType = dto.referenceType || null;
      if (dto.reference !== undefined) item.reference = dto.reference || null;
    }
    return this.checklistItemRepository.save(item);
  }

  private async resolveReferenceFromControl(
    frameworkControlId?: string,
    fallbackReferenceType?: ReferenceType,
    fallbackReference?: string,
  ): Promise<{ referenceType: ReferenceType | null; reference: string | null }> {
    if (!frameworkControlId) {
      return {
        referenceType: fallbackReferenceType || null,
        reference: fallbackReference || null,
      };
    }
    const control = await this.frameworkControlRepository.findOne({
      where: { id: frameworkControlId },
      relations: ['referentiel'],
    });
    if (!control?.referentiel) {
      return {
        referenceType: fallbackReferenceType || null,
        reference: fallbackReference || null,
      };
    }
    const refType = this.mapReferentielTypeToReferenceType(control.referentiel.type);
    const ref = `${control.code} - ${control.title}`;
    return { referenceType: refType, reference: ref };
  }

  private mapReferentielTypeToReferenceType(
    type: ReferentielType,
  ): ReferenceType {
    switch (type) {
      case ReferentielType.ISO:
        return ReferenceType.ISO;
      case ReferentielType.NIST:
        return ReferenceType.NIST;
      case ReferentielType.OWASP:
        return ReferenceType.OWASP;
      default:
        return ReferenceType.Internal;
    }
  }

  async removeItem(checklistId: string, itemId: string): Promise<void> {
    const item = await this.checklistItemRepository.findOne({
      where: { id: itemId, checklistId },
    });
    if (!item) {
      throw new NotFoundException(
        `Checklist item ${itemId} not found in checklist ${checklistId}`,
      );
    }
    await this.checklistItemRepository.remove(item);
  }

  async detachObject(checklistId: string, objectId: string): Promise<{ deleted: number }> {
    const runs = await this.checklistRunRepository.find({
      where: { checklistId, objectId },
    });
    if (runs.length === 0) return { deleted: 0 };
    await this.checklistRunRepository.remove(runs);
    return { deleted: runs.length };
  }

  async findRunsByObject(objectId: string, excludeSeeded = true): Promise<ChecklistRun[]> {
    const where: FindOptionsWhere<ChecklistRun> = { objectId };
    if (excludeSeeded) {
      where.executedById = Not('seed');
    }
    return this.checklistRunRepository.find({
      where,
      relations: ['checklist'],
      order: { createdAt: 'DESC' },
    });
  }

  async completeRun(runId: string): Promise<ChecklistRun> {
    const run = await this.findRun(runId);
    run.status = RunStatus.Completed;
    run.completedAt = new Date();
    const saved = await this.checklistRunRepository.save(run);
    // Clean up duplicate tasks for this object
    await this.deduplicateTasks(run.objectId);
    // Auto-compute score for the related object
    await this.scoringService.computeScore(run.objectId);
    return saved;
  }

  async deduplicateTasks(objectId: string): Promise<number> {
    // Find all tasks for this object that have a checklistRunItemId
    const tasks = await this.taskRepository.find({
      where: { objectId },
      order: { updatedAt: 'DESC' },
    });

    const autoTasks = tasks.filter((t) => t.checklistRunItemId);
    if (autoTasks.length === 0) return 0;

    // Load run items to get the checklistItemId for each task
    const runItemIds = autoTasks.map((t) => t.checklistRunItemId!);
    const runItems = await this.checklistRunItemRepository.find({
      where: { id: In(runItemIds) },
    });
    const runItemMap = new Map(runItems.map((ri) => [ri.id, ri.checklistItemId]));

    // Group tasks by checklistItemId
    const groups = new Map<string, Task[]>();
    for (const task of autoTasks) {
      const checklistItemId = runItemMap.get(task.checklistRunItemId!);
      if (!checklistItemId) continue;
      const existing = groups.get(checklistItemId) || [];
      existing.push(task);
      groups.set(checklistItemId, existing);
    }

    // For each group with duplicates, keep the most relevant one and remove the rest
    let removed = 0;
    for (const [, groupTasks] of groups) {
      if (groupTasks.length <= 1) continue;

      // Priority: keep the one with the most advanced status
      const statusPriority: Record<string, number> = {
        [TaskStatus.Review]: 4,
        [TaskStatus.InProgress]: 3,
        [TaskStatus.ToDo]: 2,
        [TaskStatus.Done]: 1,
      };

      groupTasks.sort((a, b) => {
        const pa = statusPriority[a.status] || 0;
        const pb = statusPriority[b.status] || 0;
        if (pa !== pb) return pb - pa;
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });

      const keep = groupTasks[0];
      const duplicates = groupTasks.slice(1);
      // If any duplicate is Done and the keeper is not, check if we should keep Done status
      const anyDone = duplicates.some((t) => t.status === TaskStatus.Done);
      if (anyDone && keep.status === TaskStatus.ToDo) {
        keep.status = TaskStatus.Done;
        await this.taskRepository.save(keep);
      }
      await this.taskRepository.remove(duplicates);
      removed += duplicates.length;
    }

    return removed;
  }

  private async recalculateRunScore(runId: string): Promise<void> {
    const run = await this.checklistRunRepository.findOne({
      where: { id: runId },
      relations: ['items', 'items.checklistItem', 'checklist'],
    });

    if (!run) return;

    const criticalityFactors: Record<Criticality, number> = {
      [Criticality.Low]: 1,
      [Criticality.Medium]: 2,
      [Criticality.High]: 3,
      [Criticality.Critical]: 4,
    };

    const critFactor = criticalityFactors[run.checklist.criticality] || 1;
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const item of run.items) {
      if (
        item.status === RunItemStatus.NotApplicable ||
        item.status === RunItemStatus.Pending
      ) {
        continue;
      }

      const weight = item.checklistItem?.weight ?? 1.0;
      const itemScore = item.score ?? (item.status === RunItemStatus.Conformant ? 1.0 : 0);
      totalWeightedScore += itemScore * weight * critFactor;
      totalWeight += weight * critFactor;
    }

    run.score = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;
    await this.checklistRunRepository.save(run);
  }
}
