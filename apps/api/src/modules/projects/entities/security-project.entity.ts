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
import { ProjectStatus } from '../../../common/enums';
import { SecObject } from '../../objects/entities/object.entity';
import { ProjectMilestone } from './project-milestone.entity';
import { Task } from '../../tasks/entities/task.entity';

@Entity('security_projects')
export class SecurityProject {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.Planning })
  status!: ProjectStatus;

  @Column({ type: 'varchar' })
  ownerId!: string;

  @Column({ type: 'date', nullable: true })
  startDate!: Date | null;

  @Column({ type: 'date', nullable: true })
  targetEndDate!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  objectId!: string | null;

  @ManyToOne(() => SecObject, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'objectId' })
  object!: SecObject | null;

  @OneToMany(() => ProjectMilestone, (m) => m.project, { cascade: true })
  milestones!: ProjectMilestone[];

  @OneToMany(() => Task, (t) => t.project)
  tasks!: Task[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
