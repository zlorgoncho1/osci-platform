import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { SecObject } from './entities/object.entity';
import { CreateObjectDto } from './dto/create-object.dto';
import { UpdateObjectDto } from './dto/update-object.dto';
import { ObjectType, ResourceType } from '../../common/enums';
import { AuthorizationService } from '../rbac/authorization.service';
import { ResourceAccessService } from '../rbac/resource-access.service';

@Injectable()
export class ObjectsService {
  constructor(
    @InjectRepository(SecObject)
    private readonly objectRepository: Repository<SecObject>,
    private readonly authorizationService: AuthorizationService,
    private readonly resourceAccessService: ResourceAccessService,
  ) {}

  async findAll(
    userId: string,
    filters?: { type?: ObjectType; parentId?: string },
  ): Promise<SecObject[]> {
    const accessibleIds = await this.authorizationService.getAccessibleResourceIds(
      userId,
      ResourceType.Object,
    );

    const qb = this.objectRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.parent', 'parent')
      .leftJoinAndSelect('o.children', 'children')
      .orderBy('o.createdAt', 'DESC');

    if (accessibleIds !== 'all') {
      if (accessibleIds.length === 0) {
        qb.where('o."createdById" = :userId::uuid', { userId });
      } else {
        qb.where('(o.id IN (:...accessibleIds) OR o."createdById" = :userId::uuid)', {
          accessibleIds,
          userId,
        });
      }
    }

    if (filters?.type) {
      qb.andWhere('o.type = :type', { type: filters.type });
    }
    if (filters?.parentId) {
      qb.andWhere('o."parentId" = :parentId::uuid', { parentId: filters.parentId });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<SecObject> {
    const obj = await this.objectRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
    if (!obj) {
      throw new NotFoundException(`Object with id ${id} not found`);
    }
    return obj;
  }

  async create(dto: CreateObjectDto, userId: string): Promise<SecObject> {
    const obj = this.objectRepository.create({
      name: dto.name,
      type: dto.type,
      description: dto.description || null,
      metadata: dto.metadata || null,
      parentId: dto.parentId || null,
      createdById: userId,
    });
    const saved = await this.objectRepository.save(obj);

    await this.resourceAccessService.createCreatorAccess(
      ResourceType.Object,
      saved.id,
      userId,
    );

    return saved;
  }

  async update(id: string, dto: UpdateObjectDto): Promise<SecObject> {
    const obj = await this.findOne(id);
    Object.assign(obj, dto);
    return this.objectRepository.save(obj);
  }

  async remove(id: string): Promise<void> {
    const obj = await this.findOne(id);
    await this.objectRepository.remove(obj);
  }
}
