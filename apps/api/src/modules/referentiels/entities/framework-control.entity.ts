import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Referentiel } from './referentiel.entity';

@Entity('framework_controls')
export class FrameworkControl {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  referentielId!: string;

  @ManyToOne(() => Referentiel, (ref) => ref.controls, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referentielId' })
  referentiel!: Referentiel;

  @Column({ length: 50 })
  code!: string;

  @Column({ length: 500 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'uuid', nullable: true })
  parentControlId!: string | null;

  @ManyToOne(() => FrameworkControl, (control) => control.children, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'parentControlId' })
  parent!: FrameworkControl | null;

  @OneToMany(() => FrameworkControl, (control) => control.parent)
  children!: FrameworkControl[];

  @Column({ type: 'int', default: 0 })
  orderIndex!: number;

  @Column({ type: 'json', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
