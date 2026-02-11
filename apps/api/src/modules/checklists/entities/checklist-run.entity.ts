import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { RunStatus } from '../../../common/enums';
import { Checklist } from './checklist.entity';
import { SecObject } from '../../objects/entities/object.entity';
import { ChecklistRunItem } from './checklist-run-item.entity';

@Entity('checklist_runs')
export class ChecklistRun {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  checklistId!: string;

  @ManyToOne(() => Checklist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'checklistId' })
  checklist!: Checklist;

  @Column({ type: 'uuid' })
  objectId!: string;

  @ManyToOne(() => SecObject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'objectId' })
  object!: SecObject;

  @Column()
  executedById!: string;

  @Column({ type: 'enum', enum: RunStatus, default: RunStatus.InProgress })
  status!: RunStatus;

  @Column({ type: 'float', nullable: true })
  score!: number | null;

  @OneToMany(() => ChecklistRunItem, (item) => item.checklistRun, {
    cascade: true,
  })
  items!: ChecklistRunItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date | null;
}
