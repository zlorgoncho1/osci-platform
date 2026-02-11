import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ObjectGroup } from './entities/object-group.entity';
import { SecObject } from '../objects/entities/object.entity';
import { CreateObjectGroupDto } from './dto/create-object-group.dto';
import { UpdateObjectGroupDto } from './dto/update-object-group.dto';
import { ScoringService } from '../scoring/scoring.service';

@Injectable()
export class ObjectGroupsService {
  constructor(
    @InjectRepository(ObjectGroup)
    private readonly groupRepository: Repository<ObjectGroup>,
    @InjectRepository(SecObject)
    private readonly objectRepository: Repository<SecObject>,
    private readonly scoringService: ScoringService,
  ) {}

  async findAll(): Promise<ObjectGroup[]> {
    return this.groupRepository.find({
      relations: ['objects'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ObjectGroup> {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['objects'],
    });
    if (!group) {
      throw new NotFoundException(`Object group with id ${id} not found`);
    }
    return group;
  }

  async create(dto: CreateObjectGroupDto): Promise<ObjectGroup> {
    const group = this.groupRepository.create({
      name: dto.name,
      description: dto.description || null,
    });

    if (dto.objectIds && dto.objectIds.length > 0) {
      group.objects = await this.objectRepository.findBy({
        id: In(dto.objectIds),
      });
    }

    return this.groupRepository.save(group);
  }

  async update(id: string, dto: UpdateObjectGroupDto): Promise<ObjectGroup> {
    const group = await this.findOne(id);
    if (dto.name !== undefined) group.name = dto.name;
    if (dto.description !== undefined) group.description = dto.description || null;
    return this.groupRepository.save(group);
  }

  async remove(id: string): Promise<void> {
    const group = await this.findOne(id);
    await this.groupRepository.remove(group);
  }

  async addMembers(groupId: string, objectIds: string[]): Promise<ObjectGroup> {
    const group = await this.findOne(groupId);
    const existingIds = new Set(group.objects.map((o) => o.id));
    const newObjects = await this.objectRepository.findBy({
      id: In(objectIds.filter((id) => !existingIds.has(id))),
    });
    group.objects = [...group.objects, ...newObjects];
    return this.groupRepository.save(group);
  }

  async removeMembers(groupId: string, objectIds: string[]): Promise<ObjectGroup> {
    const group = await this.findOne(groupId);
    const removeSet = new Set(objectIds);
    group.objects = group.objects.filter((o) => !removeSet.has(o.id));
    return this.groupRepository.save(group);
  }

  async getGroupScore(
    groupId: string,
  ): Promise<{ averageScore: number; objectScores: { objectId: string; objectName: string; score: number | null }[] }> {
    const group = await this.findOne(groupId);

    const objectScores: { objectId: string; objectName: string; score: number | null }[] = [];
    let total = 0;
    let count = 0;

    for (const obj of group.objects) {
      const score = await this.scoringService.getScoreForObject(obj.id);
      const value = score?.value ?? null;
      objectScores.push({ objectId: obj.id, objectName: obj.name, score: value });
      if (value !== null) {
        total += value;
        count++;
      }
    }

    return {
      averageScore: count > 0 ? Math.round((total / count) * 100) / 100 : 0,
      objectScores,
    };
  }
}
