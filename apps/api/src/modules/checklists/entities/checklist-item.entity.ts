import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import {
  ChecklistItemType,
  ReferenceType,
} from '../../../common/enums';
import { Checklist } from './checklist.entity';
import { FrameworkControl } from '../../referentiels/entities/framework-control.entity';

@Entity('checklist_items')
export class ChecklistItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  checklistId!: string;

  @ManyToOne(() => Checklist, (checklist) => checklist.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'checklistId' })
  checklist!: Checklist;

  @Column()
  question!: string;

  @Column({ type: 'enum', enum: ChecklistItemType })
  itemType!: ChecklistItemType;

  @Column({ type: 'float', default: 1.0 })
  weight!: number;

  @Column({ type: 'text', nullable: true })
  expectedEvidence!: string | null;

  @Column({ type: 'enum', enum: ReferenceType, nullable: true })
  referenceType!: ReferenceType | null;

  @Column({ type: 'varchar', nullable: true })
  reference!: string | null;

  @Column({ type: 'uuid', nullable: true })
  frameworkControlId!: string | null;

  @ManyToOne(() => FrameworkControl, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'frameworkControlId' })
  frameworkControl!: FrameworkControl | null;

  @Column({ type: 'int', default: 0 })
  orderIndex!: number;

  @Column({ type: 'varchar', nullable: true })
  autoTaskTitle!: string | null;
}
