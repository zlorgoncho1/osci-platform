import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChecklistDomain, ChecklistType, Criticality } from '../../../common/enums';
import { ChecklistItem } from './checklist-item.entity';
import { Referentiel } from '../../referentiels/entities/referentiel.entity';

@Entity('checklists')
export class Checklist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ default: '1.0' })
  version!: string;

  @Column({ type: 'enum', enum: ChecklistDomain })
  domain!: ChecklistDomain;

  @Column({ type: 'enum', enum: ChecklistType, default: ChecklistType.Compliance })
  checklistType!: ChecklistType;

  @Column({ type: 'enum', enum: Criticality })
  criticality!: Criticality;

  @Column({ type: 'simple-json' })
  applicability!: string[];

  @Column({ type: 'boolean', default: false })
  isReference!: boolean;

  @Column({ type: 'uuid', nullable: true })
  referentielId!: string | null;

  @ManyToOne(() => Referentiel, (ref) => ref.referenceChecklists, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'referentielId' })
  referentiel!: Referentiel | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @OneToMany(() => ChecklistItem, (item) => item.checklist, { cascade: true })
  items!: ChecklistItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
