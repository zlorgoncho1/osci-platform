import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Score } from './entities/score.entity';
import { ChecklistRun } from '../checklists/entities/checklist-run.entity';
import { Criticality, RunStatus, RunItemStatus } from '../../common/enums';

@Injectable()
export class ScoringService {
  constructor(
    @InjectRepository(Score)
    private readonly scoreRepository: Repository<Score>,
    @InjectRepository(ChecklistRun)
    private readonly checklistRunRepository: Repository<ChecklistRun>,
  ) {}

  async getScoreForObject(objectId: string): Promise<Score | null> {
    return this.scoreRepository.findOne({
      where: { objectId },
      order: { computedAt: 'DESC' },
    });
  }

  async getGlobalScore(): Promise<{
    globalScore: number;
    objectCount: number;
    scores: Score[];
  }> {
    const scores = await this.scoreRepository
      .createQueryBuilder('score')
      .distinctOn(['score.objectId'])
      .orderBy('score.objectId')
      .addOrderBy('score.computedAt', 'DESC')
      .getMany();

    const globalScore =
      scores.length > 0
        ? scores.reduce((sum, s) => sum + s.value, 0) / scores.length
        : 0;

    return {
      globalScore: Math.round(globalScore * 100) / 100,
      objectCount: scores.length,
      scores,
    };
  }

  async computeScore(objectId: string): Promise<Score> {
    // Include both Completed and InProgress runs so partially-answered
    // checklists still contribute to the object's security score
    const runs = await this.checklistRunRepository.find({
      where: [
        { objectId, status: RunStatus.Completed },
        { objectId, status: RunStatus.InProgress },
      ],
      relations: ['items', 'items.checklistItem', 'checklist'],
    });

    // Filter to only runs that have at least one answered item
    const scoredRuns = runs.filter((run) =>
      run.items.some((item) => item.status !== RunItemStatus.Pending),
    );

    if (scoredRuns.length === 0) {
      const emptyScore = this.scoreRepository.create({
        objectId,
        value: 0,
        breakdown: {},
        computedAt: new Date(),
      });
      return this.scoreRepository.save(emptyScore);
    }

    const criticalityFactors: Record<Criticality, number> = {
      [Criticality.Low]: 1,
      [Criticality.Medium]: 2,
      [Criticality.High]: 3,
      [Criticality.Critical]: 4,
    };

    let totalWeightedScore = 0;
    let totalWeight = 0;
    const domainScores: Record<string, { score: number; weight: number }> = {};

    for (const run of scoredRuns) {
      const critFactor =
        criticalityFactors[run.checklist.criticality] || 1;
      const domain = run.checklist.domain;

      if (!domainScores[domain]) {
        domainScores[domain] = { score: 0, weight: 0 };
      }

      for (const item of run.items) {
        if (
          item.status === RunItemStatus.NotApplicable ||
          item.status === RunItemStatus.Pending
        ) {
          continue;
        }

        const weight = item.checklistItem?.weight ?? 1.0;
        const itemScore =
          item.score ??
          (item.status === RunItemStatus.Conformant ? 1.0 : 0);
        const weightedScore = itemScore * weight * critFactor;
        const weightedDenom = weight * critFactor;

        totalWeightedScore += weightedScore;
        totalWeight += weightedDenom;

        domainScores[domain].score += weightedScore;
        domainScores[domain].weight += weightedDenom;
      }
    }

    const overallScore =
      totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;

    const breakdown: Record<string, number> = {};
    for (const [domain, data] of Object.entries(domainScores)) {
      breakdown[domain] =
        data.weight > 0
          ? Math.round((data.score / data.weight) * 100 * 100) / 100
          : 0;
    }

    const score = this.scoreRepository.create({
      objectId,
      value: Math.round(overallScore * 100) / 100,
      breakdown,
      computedAt: new Date(),
    });

    return this.scoreRepository.save(score);
  }
}
