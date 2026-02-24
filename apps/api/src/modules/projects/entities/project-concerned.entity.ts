import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { SecurityProject } from './security-project.entity';

@Entity('project_concerned')
@Unique(['projectId', 'userId'])
export class ProjectConcerned {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  projectId!: string;

  @ManyToOne(() => SecurityProject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project!: SecurityProject;

  @Column({ type: 'uuid' })
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
