import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';
import { Evidence } from './entities/evidence.entity';
import { Readable } from 'stream';
import { ResourceType } from '../../common/enums';
import { AuthorizationService } from '../rbac/authorization.service';
import { ResourceAccessService } from '../rbac/resource-access.service';

@Injectable()
export class EvidenceService implements OnModuleInit {
  private readonly logger = new Logger(EvidenceService.name);
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(
    @InjectRepository(Evidence)
    private readonly evidenceRepository: Repository<Evidence>,
    private readonly configService: ConfigService,
    private readonly authorizationService: AuthorizationService,
    private readonly resourceAccessService: ResourceAccessService,
  ) {
    this.bucketName = this.configService.get<string>(
      'MINIO_BUCKET',
      'osci-evidence',
    );
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(
        this.configService.get<string>('MINIO_PORT', '9000'),
        10,
      ),
      useSSL: this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get<string>(
        'MINIO_ACCESS_KEY',
        'minioadmin',
      ),
      secretKey: this.configService.get<string>(
        'MINIO_SECRET_KEY',
        'minioadmin',
      ),
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName);
        this.logger.log(`Created MinIO bucket: ${this.bucketName}`);
      }
    } catch (error) {
      this.logger.warn(
        `Could not initialize MinIO bucket: ${error}. Evidence uploads will fail until MinIO is available.`,
      );
    }
  }

  async upload(
    file: {
      originalname: string;
      mimetype: string;
      buffer: Buffer;
      size: number;
    },
    uploadedById: string,
    objectId?: string,
    checklistRunItemId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<Evidence> {
    const storageKey = `${uuidv4()}/${file.originalname}`;

    await this.minioClient.putObject(
      this.bucketName,
      storageKey,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype },
    );

    const evidence = this.evidenceRepository.create({
      filename: file.originalname,
      mimeType: file.mimetype,
      storageKey,
      size: file.size,
      uploadedById,
      objectId: objectId || null,
      checklistRunItemId: checklistRunItemId || null,
      metadata: metadata || null,
    });

    const saved = await this.evidenceRepository.save(evidence);
    await this.resourceAccessService.createCreatorAccess(ResourceType.Evidence, saved.id, uploadedById);
    return saved;
  }

  async findAll(userId: string, filters?: {
    objectId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Evidence[]; total: number; page: number; limit: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    // Visibility filtering
    const accessibleIds = await this.authorizationService.getAccessibleResourceIds(userId, ResourceType.Evidence);

    const qb = this.evidenceRepository
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.object', 'object')
      .orderBy('e.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // Apply visibility filter
    if (accessibleIds !== 'all') {
      if (accessibleIds.length > 0) {
        qb.andWhere('(e.id IN (:...accessibleIds) OR e."uploadedById" = :userId)', { accessibleIds, userId });
      } else {
        qb.andWhere('e."uploadedById" = :userId', { userId });
      }
    }

    if (filters?.objectId) {
      qb.andWhere('e."objectId" = :objectId::uuid', { objectId: filters.objectId });
    }
    if (filters?.search?.trim()) {
      qb.andWhere('e.filename ILIKE :search', { search: `%${filters.search.trim()}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Evidence> {
    const evidence = await this.evidenceRepository.findOne({
      where: { id },
      relations: ['object'],
    });
    if (!evidence) {
      throw new NotFoundException(`Evidence with id ${id} not found`);
    }
    return evidence;
  }

  async download(id: string): Promise<{ stream: Readable; evidence: Evidence }> {
    const evidence = await this.findOne(id);
    const stream = await this.minioClient.getObject(
      this.bucketName,
      evidence.storageKey,
    );
    return { stream, evidence };
  }
}
