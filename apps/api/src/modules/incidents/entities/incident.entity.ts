import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IncidentSeverity } from '../../../common/enums';
import { SecObject } from '../../objects/entities/object.entity';

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  objectId!: string;

  @ManyToOne(() => SecObject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'objectId' })
  object!: SecObject;

  @Column()
  title!: string;

  @Column()
  type!: string;

  @Column({ type: 'enum', enum: IncidentSeverity })
  severity!: IncidentSeverity;

  @Column({ default: 'open' })
  status!: string;

  @Column({ type: 'json', nullable: true })
  details!: Record<string, unknown> | null;

  @Column({ type: 'timestamp' })
  occurredAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
