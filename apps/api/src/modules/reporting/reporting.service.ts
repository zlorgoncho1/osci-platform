import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { Score } from '../scoring/entities/score.entity';
import { ChecklistRun } from '../checklists/entities/checklist-run.entity';
import { Incident } from '../incidents/entities/incident.entity';
import { Task } from '../tasks/entities/task.entity';
import { ReferentielsService } from '../referentiels/referentiels.service';

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(Score)
    private readonly scoreRepository: Repository<Score>,
    @InjectRepository(ChecklistRun)
    private readonly checklistRunRepository: Repository<ChecklistRun>,
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly referentielsService: ReferentielsService,
  ) {}

  async findAll(): Promise<Report[]> {
    return this.reportRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportRepository.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException(`Report with id ${id} not found`);
    }
    return report;
  }

  async generateReport(
    dto: CreateReportDto,
    generatedById: string,
  ): Promise<Report> {
    let content: Record<string, unknown> = {};

    switch (dto.type) {
      case 'audit':
        content = await this.generateAuditReport(dto.filters);
        break;
      case 'compliance':
        content = await this.generateComplianceReport(dto.filters);
        break;
      case 'executive':
        content = await this.generateExecutiveReport(dto.filters);
        break;
      case 'compliance-by-referentiel':
        content = await this.generateComplianceByReferentielReport(dto.filters);
        break;
    }

    const report = this.reportRepository.create({
      title: dto.title,
      type: dto.type,
      filters: dto.filters || null,
      content,
      generatedById,
    });

    return this.reportRepository.save(report);
  }

  private async generateAuditReport(
    filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const runs = await this.checklistRunRepository.find({
      relations: ['checklist', 'object', 'items'],
      order: { createdAt: 'DESC' },
      take: 100,
    });

    return {
      type: 'audit',
      generatedAt: new Date().toISOString(),
      totalRuns: runs.length,
      runs: runs.map((run) => ({
        id: run.id,
        checklist: run.checklist?.title,
        object: run.object?.name,
        status: run.status,
        score: run.score,
        createdAt: run.createdAt,
        completedAt: run.completedAt,
        itemCount: run.items?.length || 0,
      })),
      filters: filters || {},
    };
  }

  private async generateComplianceReport(
    filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const scores = await this.scoreRepository.find({
      relations: ['object'],
      order: { computedAt: 'DESC' },
    });

    const incidents = await this.incidentRepository.find({
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return {
      type: 'compliance',
      generatedAt: new Date().toISOString(),
      scores: scores.map((s) => ({
        objectId: s.objectId,
        objectName: s.object?.name,
        value: s.value,
        breakdown: s.breakdown,
        computedAt: s.computedAt,
      })),
      incidentSummary: {
        total: incidents.length,
        open: incidents.filter((i) => i.status === 'open').length,
        resolved: incidents.filter((i) => i.status !== 'open').length,
      },
      filters: filters || {},
    };
  }

  private async generateExecutiveReport(
    filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const scores = await this.scoreRepository.find({
      order: { computedAt: 'DESC' },
    });

    const tasks = await this.taskRepository.find();
    const incidents = await this.incidentRepository.find();

    const avgScore =
      scores.length > 0
        ? scores.reduce((sum, s) => sum + s.value, 0) / scores.length
        : 0;

    return {
      type: 'executive',
      generatedAt: new Date().toISOString(),
      summary: {
        averageSecurityScore: Math.round(avgScore * 100) / 100,
        totalObjects: new Set(scores.map((s) => s.objectId)).size,
        totalTasks: tasks.length,
        openTasks: tasks.filter((t) => t.status !== 'Done').length,
        totalIncidents: incidents.length,
        openIncidents: incidents.filter((i) => i.status === 'open').length,
        criticalIncidents: incidents.filter(
          (i) => i.severity === 'Critical',
        ).length,
      },
      filters: filters || {},
    };
  }

  private async generateComplianceByReferentielReport(
    filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const referentielId = filters?.referentielId as string;
    if (!referentielId) {
      return {
        type: 'compliance-by-referentiel',
        generatedAt: new Date().toISOString(),
        error: 'referentielId is required in filters',
        controls: [],
        stats: { totalControls: 0, mappedControls: 0, coveragePercent: 0 },
        filters: filters || {},
      };
    }

    const referentiel = await this.referentielsService.findOne(referentielId);
    const stats = await this.referentielsService.getComplianceStats(referentielId);
    const controls = referentiel.controls || [];

    const controlsWithStatus = await Promise.all(
      controls.map(async (ctrl: any) => {
        const mappedItems = await this.referentielsService.getMappedChecklistItems(ctrl.id);
        return {
          id: ctrl.id,
          code: ctrl.code,
          title: ctrl.title,
          mapped: mappedItems.length > 0,
          mappingCount: mappedItems.length,
        };
      }),
    );

    return {
      type: 'compliance-by-referentiel',
      generatedAt: new Date().toISOString(),
      referentiel: {
        id: referentiel.id,
        name: referentiel.name,
        code: referentiel.code,
        version: referentiel.version,
      },
      stats,
      controls: controlsWithStatus,
      filters: filters || {},
    };
  }
}
