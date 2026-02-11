import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MilestoneStatus } from '../../../common/enums';
import { SecurityProject } from './security-project.entity';

@Entity('project_milestones')
export class ProjectMilestone {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  projectId!: string;

  @ManyToOne(() => SecurityProject, (p) => p.milestones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project!: SecurityProject;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'enum', enum: MilestoneStatus, default: MilestoneStatus.Pending })
  status!: MilestoneStatus;

  @Column({ type: 'date', nullable: true })
  dueDate!: Date | null;

  @Column({ type: 'int', default: 0 })
  order!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
