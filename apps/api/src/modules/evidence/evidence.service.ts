import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';
import { Evidence } from './entities/evidence.entity';
import { Readable } from 'stream';

@Injectable()
export class EvidenceService implements OnModuleInit {
  private readonly logger = new Logger(EvidenceService.name);
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(
    @InjectRepository(Evidence)
    private readonly evidenceRepository: Repository<Evidence>,
    private readonly configService: ConfigService,
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

    return this.evidenceRepository.save(evidence);
  }

  async findAll(): Promise<Evidence[]> {
    return this.evidenceRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['object'],
    });
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
