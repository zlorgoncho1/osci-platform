import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SecObject } from '../../objects/entities/object.entity';
import { AssetType, Criticality } from '../../../common/enums';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: AssetType, default: AssetType.Infrastructure })
  type!: AssetType;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'enum', enum: Criticality, nullable: true })
  criticality!: Criticality | null;

  @Column({ type: 'uuid', nullable: true })
  objectId!: string | null;

  @ManyToOne(() => SecObject, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'objectId' })
  object!: SecObject | null;

  @Column({ type: 'json', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
