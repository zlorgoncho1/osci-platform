import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { Referentiel } from './entities/referentiel.entity';
import { FrameworkControl } from './entities/framework-control.entity';
import { Checklist } from '../checklists/entities/checklist.entity';
import { ChecklistItem } from '../checklists/entities/checklist-item.entity';
import {
  ReferentielType,
  ChecklistDomain,
  ChecklistType,
  Criticality,
  ChecklistItemType,
  ReferenceType,
} from '../../common/enums';

export interface CommunityChecklistSummary {
  index: number;
  title: string;
  domain: string;
  checklistType: string;
  criticality: string;
  itemCount: number;
  alreadyImported: boolean;
}

export interface CommunityReferentielSummary {
  code: string;
  name: string;
  type: string;
  domain: string;
  version: string;
  description: string | null;
  folder: string;
  controlCount: number;
  checklistCount: number;
  alreadyImported: boolean;
  checklists: CommunityChecklistSummary[];
}

export interface ImportResult {
  referentielId: string;
  controlsImported: number;
  checklistsImported: number;
  status: 'created' | 'skipped';
}

export interface ImportChecklistResult {
  referentielId: string;
  checklistId: string;
  itemsImported: number;
  status: 'created' | 'skipped';
}

interface ReferentielJson {
  code: string;
  name: string;
  description: string | null;
  version: string;
  type: string;
  domain: string;
  metadata: Record<string, unknown> | null;
  controls: Array<{
    code: string;
    title: string;
    description: string | null;
    orderIndex: number;
  }>;
  checklists: Array<{
    title: string;
    version: string;
    domain: string;
    checklistType: string;
    criticality: string;
    applicability: string[];
    description: string | null;
    items: Array<{
      question: string;
      itemType: string;
      weight: number;
      referenceType: string | null;
      reference: string | null;
      expectedEvidence: string | null;
      autoTaskTitle: string | null;
      controlCode: string | null;
    }>;
  }>;
}

@Injectable()
export class CommunityReferentielsService {
  private readonly logger = new Logger(CommunityReferentielsService.name);
  private readonly repo: string;
  private readonly branch = 'main';

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Referentiel)
    private readonly referentielRepository: Repository<Referentiel>,
    @InjectRepository(FrameworkControl)
    private readonly controlRepository: Repository<FrameworkControl>,
    @InjectRepository(Checklist)
    private readonly checklistRepository: Repository<Checklist>,
    @InjectRepository(ChecklistItem)
    private readonly checklistItemRepository: Repository<ChecklistItem>,
  ) {
    this.repo = process.env.GITHUB_REFERENTIEL_REPO || 'zlorgoncho1/osci-referentiel';
  }

  async listAvailable(): Promise<CommunityReferentielSummary[]> {
    const contentsUrl = `https://api.github.com/repos/${this.repo}/contents?ref=${this.branch}`;
    const { data: contents } = await firstValueFrom(
      this.httpService.get<Array<{ name: string; type: string }>>(contentsUrl, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      }),
    );

    const folders = contents.filter((item) => item.type === 'dir');
    const summaries: CommunityReferentielSummary[] = [];

    for (const folder of folders) {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${this.repo}/${this.branch}/${folder.name}/referentiel.json`;
        const { data: refJson } = await firstValueFrom(
          this.httpService.get<ReferentielJson>(rawUrl),
        );

        const existing = await this.referentielRepository.findOne({
          where: { code: refJson.code },
        });

        // Check per-checklist import status
        const checklistSummaries: CommunityChecklistSummary[] = [];
        for (let i = 0; i < (refJson.checklists || []).length; i++) {
          const cl = refJson.checklists[i];
          let alreadyImported = false;
          if (existing) {
            const existingCl = await this.checklistRepository.findOne({
              where: { title: cl.title, referentielId: existing.id, isReference: true },
            });
            alreadyImported = !!existingCl;
          }
          checklistSummaries.push({
            index: i,
            title: cl.title,
            domain: cl.domain,
            checklistType: cl.checklistType || 'Compliance',
            criticality: cl.criticality || 'High',
            itemCount: cl.items?.length || 0,
            alreadyImported,
          });
        }

        const allChecklistsImported = checklistSummaries.length > 0
          && checklistSummaries.every((c) => c.alreadyImported);

        summaries.push({
          code: refJson.code,
          name: refJson.name,
          type: refJson.type,
          domain: refJson.domain,
          version: refJson.version,
          description: refJson.description,
          folder: folder.name,
          controlCount: refJson.controls?.length || 0,
          checklistCount: refJson.checklists?.length || 0,
          alreadyImported: !!existing && allChecklistsImported,
          checklists: checklistSummaries,
        });
      } catch (err) {
        this.logger.warn(`Skipping folder "${folder.name}": no valid referentiel.json`);
      }
    }

    return summaries;
  }

  /**
   * Import the full referentiel: controls + all checklists.
   */
  async importFromGithub(folder: string): Promise<ImportResult> {
    const refJson = await this.fetchReferentielJson(folder);

    const existing = await this.referentielRepository.findOne({
      where: { code: refJson.code },
    });
    if (existing) {
      // Referentiel exists, import only missing checklists
      let checklistsImported = 0;
      for (const clData of refJson.checklists || []) {
        const existingCl = await this.checklistRepository.findOne({
          where: { title: clData.title, referentielId: existing.id, isReference: true },
        });
        if (!existingCl) {
          await this.createChecklist(clData, existing.id);
          checklistsImported++;
        }
      }
      return {
        referentielId: existing.id,
        controlsImported: 0,
        checklistsImported,
        status: checklistsImported > 0 ? 'created' : 'skipped',
      };
    }

    // Create referentiel + controls + all checklists
    const savedRef = await this.createReferentiel(refJson);
    const controlsImported = await this.createControls(refJson, savedRef.id);

    let checklistsImported = 0;
    for (const clData of refJson.checklists || []) {
      await this.createChecklist(clData, savedRef.id);
      checklistsImported++;
    }

    return {
      referentielId: savedRef.id,
      controlsImported,
      checklistsImported,
      status: 'created',
    };
  }

  /**
   * Import a single checklist by index. Auto-creates the referentiel + controls if needed.
   */
  async importChecklistFromGithub(folder: string, checklistIndex: number): Promise<ImportChecklistResult> {
    const refJson = await this.fetchReferentielJson(folder);

    if (!refJson.checklists || checklistIndex >= refJson.checklists.length) {
      throw new Error(`Checklist index ${checklistIndex} out of range`);
    }

    const clData = refJson.checklists[checklistIndex];

    // Ensure referentiel exists (create if needed)
    let ref = await this.referentielRepository.findOne({
      where: { code: refJson.code },
    });
    if (!ref) {
      ref = await this.createReferentiel(refJson);
      await this.createControls(refJson, ref.id);
    }

    // Check if this specific checklist already exists
    const existingCl = await this.checklistRepository.findOne({
      where: { title: clData.title, referentielId: ref.id, isReference: true },
    });
    if (existingCl) {
      return {
        referentielId: ref.id,
        checklistId: existingCl.id,
        itemsImported: 0,
        status: 'skipped',
      };
    }

    const savedChecklist = await this.createChecklist(clData, ref.id);

    return {
      referentielId: ref.id,
      checklistId: savedChecklist.id,
      itemsImported: clData.items?.length || 0,
      status: 'created',
    };
  }

  // ─── Private helpers ─────────────────────────────────────────

  private async fetchReferentielJson(folder: string): Promise<ReferentielJson> {
    const rawUrl = `https://raw.githubusercontent.com/${this.repo}/${this.branch}/${folder}/referentiel.json`;
    const { data } = await firstValueFrom(
      this.httpService.get<ReferentielJson>(rawUrl),
    );
    return data;
  }

  private async createReferentiel(refJson: ReferentielJson): Promise<Referentiel> {
    const referentiel = this.referentielRepository.create({
      code: refJson.code,
      name: refJson.name,
      description: refJson.description || null,
      version: refJson.version || '1.0',
      type: (refJson.type as ReferentielType) || ReferentielType.Internal,
      domain: (refJson.domain as ChecklistDomain) || null,
      metadata: refJson.metadata || null,
    });
    return this.referentielRepository.save(referentiel);
  }

  private async createControls(refJson: ReferentielJson, referentielId: string): Promise<number> {
    let count = 0;
    for (const ctrl of refJson.controls || []) {
      const control = this.controlRepository.create({
        referentielId,
        code: ctrl.code,
        title: ctrl.title,
        description: ctrl.description || null,
        orderIndex: ctrl.orderIndex ?? count,
      });
      await this.controlRepository.save(control);
      count++;
    }
    return count;
  }

  private async buildControlCodeMap(referentielId: string): Promise<Map<string, string>> {
    const controls = await this.controlRepository.find({ where: { referentielId } });
    const map = new Map<string, string>();
    for (const ctrl of controls) {
      map.set(ctrl.code, ctrl.id);
    }
    return map;
  }

  private async createChecklist(
    clData: ReferentielJson['checklists'][number],
    referentielId: string,
  ): Promise<Checklist> {
    const checklist = this.checklistRepository.create({
      title: clData.title,
      version: clData.version || '1.0',
      domain: (clData.domain as ChecklistDomain) || ChecklistDomain.Governance,
      checklistType: (clData.checklistType as ChecklistType) || ChecklistType.Compliance,
      criticality: (clData.criticality as Criticality) || Criticality.High,
      applicability: clData.applicability || [],
      description: clData.description || null,
      isReference: true,
      referentielId,
    });
    const saved = await this.checklistRepository.save(checklist);

    const controlCodeMap = await this.buildControlCodeMap(referentielId);

    for (let i = 0; i < (clData.items || []).length; i++) {
      const itemData = clData.items[i];
      const frameworkControlId = itemData.controlCode
        ? controlCodeMap.get(itemData.controlCode) || null
        : null;
      const item = this.checklistItemRepository.create({
        checklistId: saved.id,
        question: itemData.question,
        itemType: (itemData.itemType as ChecklistItemType) || ChecklistItemType.YesNo,
        weight: itemData.weight ?? 1.0,
        referenceType: (itemData.referenceType as ReferenceType) || null,
        reference: itemData.reference || null,
        expectedEvidence: itemData.expectedEvidence || null,
        autoTaskTitle: itemData.autoTaskTitle || null,
        frameworkControlId,
        orderIndex: i,
      });
      await this.checklistItemRepository.save(item);
    }

    return saved;
  }
}
