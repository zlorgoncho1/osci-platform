import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Asset } from './asset.entity';
import { RelationType } from '../../../common/enums';

@Entity('relations')
export class Relation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  sourceAssetId!: string;

  @ManyToOne(() => Asset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sourceAssetId' })
  sourceAsset!: Asset;

  @Column({ type: 'uuid' })
  targetAssetId!: string;

  @ManyToOne(() => Asset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'targetAssetId' })
  targetAsset!: Asset;

  @Column({ type: 'enum', enum: RelationType })
  relationType!: RelationType;

  @Column({ type: 'varchar', nullable: true })
  label!: string | null;

  @Column({ type: 'json', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
