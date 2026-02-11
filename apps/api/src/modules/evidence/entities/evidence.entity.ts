import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SecObject } from '../../objects/entities/object.entity';

@Entity('evidence')
export class Evidence {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  objectId!: string | null;

  @ManyToOne(() => SecObject, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'objectId' })
  object!: SecObject | null;

  @Column({ type: 'uuid', nullable: true })
  checklistRunItemId!: string | null;

  @Column()
  filename!: string;

  @Column()
  mimeType!: string;

  @Column()
  storageKey!: string;

  @Column({ type: 'int' })
  size!: number;

  @Column()
  uploadedById!: string;

  @Column({ type: 'json', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;
}
