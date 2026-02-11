import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RunItemStatus } from '../../../common/enums';
import { ChecklistRun } from './checklist-run.entity';
import { ChecklistItem } from './checklist-item.entity';

@Entity('checklist_run_items')
export class ChecklistRunItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  checklistRunId!: string;

  @ManyToOne(() => ChecklistRun, (run) => run.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'checklistRunId' })
  checklistRun!: ChecklistRun;

  @Column({ type: 'uuid' })
  checklistItemId!: string;

  @ManyToOne(() => ChecklistItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'checklistItemId' })
  checklistItem!: ChecklistItem;

  @Column({
    type: 'enum',
    enum: RunItemStatus,
    default: RunItemStatus.Pending,
  })
  status!: RunItemStatus;

  @Column({ type: 'text', nullable: true })
  answer!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'float', nullable: true })
  score!: number | null;
}
