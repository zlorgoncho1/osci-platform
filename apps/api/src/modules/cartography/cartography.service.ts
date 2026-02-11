import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from './entities/asset.entity';
import { Relation } from './entities/relation.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { CreateRelationDto } from './dto/create-relation.dto';
import { UpdateRelationDto } from './dto/update-relation.dto';
import { RelationType } from '../../common/enums';
import { IncidentsService } from '../incidents/incidents.service';
import { ScoringService } from '../scoring/scoring.service';

@Injectable()
export class CartographyService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(Relation)
    private readonly relationRepository: Repository<Relation>,
    private readonly incidentsService: IncidentsService,
    private readonly scoringService: ScoringService,
  ) {}

  // Assets
  async findAllAssets(): Promise<Asset[]> {
    return this.assetRepository.find({
      relations: ['object'],
      order: { createdAt: 'DESC' },
    });
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

  async createAsset(dto: CreateAssetDto): Promise<Asset> {
    const asset = this.assetRepository.create({
      name: dto.name,
      type: dto.type,
      description: dto.description || null,
      criticality: dto.criticality || null,
      objectId: dto.objectId || null,
      metadata: dto.metadata || null,
    });
    return this.assetRepository.save(asset);
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
  async findAllRelations(): Promise<Relation[]> {
    return this.relationRepository.find({
      relations: ['sourceAsset', 'targetAsset'],
    });
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
  async getTopologyGraph(): Promise<{
    nodes: Asset[];
    edges: Relation[];
    stats: { totalAssets: number; totalRelations: number; assetsByType: Record<string, number> };
  }> {
    const [nodes, edges] = await Promise.all([
      this.assetRepository.find({ relations: ['object'] }),
      this.relationRepository.find({ relations: ['sourceAsset', 'targetAsset'] }),
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

  // Enriched Topology — with scores and incidents
  async getEnrichedTopology(): Promise<{
    nodes: Array<Asset & { score?: number; openIncidents?: number }>;
    edges: Relation[];
    stats: { totalAssets: number; totalRelations: number; assetsByType: Record<string, number> };
  }> {
    const { nodes, edges, stats } = await this.getTopologyGraph();

    const enrichedNodes = await Promise.all(
      nodes.map(async (asset) => {
        const enriched: any = { ...asset };
        if (asset.objectId) {
          try {
            const score = await this.scoringService.getScoreForObject(asset.objectId);
            enriched.score = score?.value ?? null;
          } catch {
            enriched.score = null;
          }
          try {
            const incidents = await this.incidentsService.findAll({ objectId: asset.objectId });
            enriched.openIncidents = incidents.filter((i) => i.status === 'open').length;
          } catch {
            enriched.openIncidents = 0;
          }
        } else {
          enriched.score = null;
          enriched.openIncidents = 0;
        }
        return enriched;
      }),
    );

    return { nodes: enrichedNodes, edges, stats };
  }
}
