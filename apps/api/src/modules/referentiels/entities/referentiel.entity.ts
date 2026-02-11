import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ReferentielType } from '../../../common/enums';
import { ChecklistDomain } from '../../../common/enums';
import { FrameworkControl } from './framework-control.entity';
import type { Checklist } from '../../checklists/entities/checklist.entity';

@Entity('referentiels')
export class Referentiel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 50 })
  code!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ length: 20, default: '1.0' })
  version!: string;

  @Column({ type: 'enum', enum: ReferentielType })
  type!: ReferentielType;

  @Column({ type: 'enum', enum: ChecklistDomain, nullable: true })
  domain!: ChecklistDomain | null;

  @Column({ type: 'json', nullable: true })
  metadata!: Record<string, unknown> | null;

  @OneToMany(() => FrameworkControl, (control) => control.referentiel, {
    cascade: true,
  })
  controls!: FrameworkControl[];

  @OneToMany('Checklist', 'referentiel')
  referenceChecklists!: Checklist[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
