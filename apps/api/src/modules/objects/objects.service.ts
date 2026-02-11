import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { SecObject } from './entities/object.entity';
import { CreateObjectDto } from './dto/create-object.dto';
import { UpdateObjectDto } from './dto/update-object.dto';
import { ObjectType } from '../../common/enums';

@Injectable()
export class ObjectsService {
  constructor(
    @InjectRepository(SecObject)
    private readonly objectRepository: Repository<SecObject>,
  ) {}

  async findAll(filters?: {
    type?: ObjectType;
    parentId?: string;
  }): Promise<SecObject[]> {
    const where: FindOptionsWhere<SecObject> = {};

    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.parentId) {
      where.parentId = filters.parentId;
    }

    return this.objectRepository.find({
      where,
      relations: ['parent', 'children'],
      order: { createdAt: 'DESC' },
    });
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

  async create(dto: CreateObjectDto): Promise<SecObject> {
    const obj = this.objectRepository.create({
      name: dto.name,
      type: dto.type,
      description: dto.description || null,
      metadata: dto.metadata || null,
      parentId: dto.parentId || null,
    });
    return this.objectRepository.save(obj);
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
