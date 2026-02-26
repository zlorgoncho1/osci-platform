import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from './entities/asset.entity';
import { Relation } from './entities/relation.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { CreateRelationDto } from './dto/create-relation.dto';
import { UpdateRelationDto } from './dto/update-relation.dto';
import { RelationType, ResourceType } from '../../common/enums';
import { IncidentsService } from '../incidents/incidents.service';
import { ScoringService } from '../scoring/scoring.service';
import { AuthorizationService } from '../rbac/authorization.service';
import { ResourceAccessService } from '../rbac/resource-access.service';

@Injectable()
export class CartographyService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(Relation)
    private readonly relationRepository: Repository<Relation>,
    private readonly incidentsService: IncidentsService,
    private readonly scoringService: ScoringService,
    private readonly authorizationService: AuthorizationService,
    private readonly resourceAccessService: ResourceAccessService,
  ) {}

  // Assets
  async findAllAssets(userId: string): Promise<Asset[]> {
    const accessibleIds = await this.authorizationService.getAccessibleResourceIds(userId, ResourceType.CartographyAsset);

    if (accessibleIds === 'all') {
      return this.assetRepository.find({
        relations: ['object'],
        order: { createdAt: 'DESC' },
      });
    }

    const qb = this.assetRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.object', 'object')
      .orderBy('a.createdAt', 'DESC');

    if (accessibleIds.length > 0) {
      qb.where('(a.id IN (:...accessibleIds) OR a."createdById" = :userId::uuid)', { accessibleIds, userId });
    } else {
      qb.where('a."createdById" = :userId::uuid', { userId });
    }

    return qb.getMany();
  }

  async findOneAsset(id: string): Promise<Asset> {
    const asset = await this.assetRepository.findOne({
      where: { id },
      relations: ['object'],
    });
    if (!asset) {
      throw new NotFoundException(`Asset with id ${id} not found`);
    }
    return asset;
  }

  async createAsset(dto: CreateAssetDto, userId: string): Promise<Asset> {
    const asset = this.assetRepository.create({
      name: dto.name,
      type: dto.type,
      description: dto.description || null,
      criticality: dto.criticality || null,
      objectId: dto.objectId || null,
      metadata: dto.metadata || null,
      createdById: userId,
    });
    const saved = await this.assetRepository.save(asset);
    await this.resourceAccessService.createCreatorAccess(ResourceType.CartographyAsset, saved.id, userId);
    return saved;
  }

  async updateAsset(id: string, dto: UpdateAssetDto): Promise<Asset> {
    const asset = await this.findOneAsset(id);
    Object.assign(asset, dto);
    return this.assetRepository.save(asset);
  }

  async removeAsset(id: string): Promise<void> {
    const asset = await this.findOneAsset(id);
    await this.assetRepository.remove(asset);
  }

  // Relations
  async findAllRelations(userId: string): Promise<Relation[]> {
    const accessibleIds = await this.authorizationService.getAccessibleResourceIds(userId, ResourceType.CartographyAsset);

    if (accessibleIds === 'all') {
      return this.relationRepository.find({
        relations: ['sourceAsset', 'targetAsset'],
      });
    }

    // Filter relations where both source and target are accessible assets
    const qb = this.relationRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.sourceAsset', 'source')
      .leftJoinAndSelect('r.targetAsset', 'target');

    if (accessibleIds.length > 0) {
      qb.where(
        '(r.sourceAssetId IN (:...accessibleIds) OR source."createdById" = :userId::uuid)',
        { accessibleIds, userId },
      ).andWhere(
        '(r.targetAssetId IN (:...aids) OR target."createdById" = :uid::uuid)',
        { aids: accessibleIds, uid: userId },
      );
    } else {
      qb.where('source."createdById" = :userId::uuid', { userId })
        .andWhere('target."createdById" = :uid::uuid', { uid: userId });
    }

    return qb.getMany();
  }

  async createRelation(dto: CreateRelationDto): Promise<Relation> {
    const relation = this.relationRepository.create({
      sourceAssetId: dto.sourceAssetId,
      targetAssetId: dto.targetAssetId,
      relationType: dto.relationType,
      label: dto.label || null,
      metadata: dto.metadata || null,
    });
    return this.relationRepository.save(relation);
  }

  async updateRelation(id: string, dto: UpdateRelationDto): Promise<Relation> {
    const relation = await this.relationRepository.findOne({
      where: { id },
      relations: ['sourceAsset', 'targetAsset'],
    });
    if (!relation) {
      throw new NotFoundException(`Relation with id ${id} not found`);
    }
    Object.assign(relation, dto);
    return this.relationRepository.save(relation);
  }

  async removeRelation(id: string): Promise<void> {
    const relation = await this.relationRepository.findOne({
      where: { id },
    });
    if (!relation) {
      throw new NotFoundException(`Relation with id ${id} not found`);
    }
    await this.relationRepository.remove(relation);
  }

  // Topology
  async getTopologyGraph(userId: string): Promise<{
    nodes: Asset[];
    edges: Relation[];
    stats: { totalAssets: number; totalRelations: number; assetsByType: Record<string, number> };
  }> {
    const [nodes, edges] = await Promise.all([
      this.findAllAssets(userId),
      this.findAllRelations(userId),
    ]);

    const assetsByType: Record<string, number> = {};
    for (const node of nodes) {
      assetsByType[node.type] = (assetsByType[node.type] || 0) + 1;
    }

    return {
      nodes,
      edges,
      stats: {
        totalAssets: nodes.length,
        totalRelations: edges.length,
        assetsByType,
      },
    };
  }

  // Impact Analysis — BFS on reverse dependency graph
  async getImpactAnalysis(assetId: string): Promise<{
    impactedAssetIds: string[];
    traversalDepth: number;
    paths: Record<string, string[]>;
  }> {
    await this.findOneAsset(assetId); // validate exists

    const relations = await this.relationRepository.find();
    const impactRelationTypes = new Set<RelationType>([
      RelationType.depends_on,
      RelationType.hosts,
      RelationType.contains,
    ]);

    // Build adjacency: for depends_on, the source depends on the target,
    // so if target is impacted, source is impacted too (reverse traversal).
    // For hosts/contains, if the host/container is impacted, what it hosts is too (forward).
    const adjacency = new Map<string, string[]>();
    for (const rel of relations) {
      if (!impactRelationTypes.has(rel.relationType)) continue;

      if (rel.relationType === RelationType.depends_on) {
        // target is down -> source is impacted
        const list = adjacency.get(rel.targetAssetId) || [];
        list.push(rel.sourceAssetId);
        adjacency.set(rel.targetAssetId, list);
      } else {
        // hosts/contains: source is down -> target is impacted
        const list = adjacency.get(rel.sourceAssetId) || [];
        list.push(rel.targetAssetId);
        adjacency.set(rel.sourceAssetId, list);
      }
    }

    // BFS
    const visited = new Set<string>([assetId]);
    const queue: Array<{ id: string; depth: number; path: string[] }> = [
      { id: assetId, depth: 0, path: [assetId] },
    ];
    const paths: Record<string, string[]> = {};
    let maxDepth = 0;

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = adjacency.get(current.id) || [];
      for (const neighbor of neighbors) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        const newPath = [...current.path, neighbor];
        paths[neighbor] = newPath;
        const depth = current.depth + 1;
        if (depth > maxDepth) maxDepth = depth;
        queue.push({ id: neighbor, depth, path: newPath });
      }
    }

    visited.delete(assetId); // don't include the source in impacted list

    return {
      impactedAssetIds: Array.from(visited),
      traversalDepth: maxDepth,
      paths,
    };
  }

  // Enriched Topology — with scores and incidents (batch queries)
  async getEnrichedTopology(userId: string): Promise<{
    nodes: Array<Asset & { score?: number; openIncidents?: number }>;
    edges: Relation[];
    stats: { totalAssets: number; totalRelations: number; assetsByType: Record<string, number> };
  }> {
    const { nodes, edges, stats } = await this.getTopologyGraph(userId);

    // Collect all objectIds from nodes that have one
    const objectIds = nodes
      .map((n) => n.objectId)
      .filter((id): id is string => !!id);

    // Batch fetch scores and incident counts (2 queries instead of 2N)
    const [scoresMap, incidentCountsMap] = await Promise.all([
      this.scoringService.getScoresByObjectIds(objectIds),
      this.incidentsService.countOpenByObjectIds(objectIds),
    ]);

    const enrichedNodes = nodes.map((asset) => {
      const enriched: any = { ...asset };
      if (asset.objectId) {
        enriched.score = scoresMap[asset.objectId] ?? null;
        enriched.openIncidents = incidentCountsMap[asset.objectId] ?? 0;
      } else {
        enriched.score = null;
        enriched.openIncidents = 0;
      }
      return enriched;
    });

    return { nodes: enrichedNodes, edges, stats };
  }
}
