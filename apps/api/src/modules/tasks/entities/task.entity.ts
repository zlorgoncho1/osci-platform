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
import { TaskStatus, Criticality } from '../../../common/enums';
import { SecObject } from '../../objects/entities/object.entity';
import { SecurityProject } from '../../projects/entities/security-project.entity';
import { TaskComment } from './task-comment.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  objectId!: string | null;

  @ManyToOne(() => SecObject, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'objectId' })
  object!: SecObject | null;

  @Column({ type: 'uuid', nullable: true })
  checklistRunItemId!: string | null;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.ToDo })
  status!: TaskStatus;

  @Column({ type: 'varchar', nullable: true })
  assignedToId!: string | null;

  @Column({ type: 'date', nullable: true })
  slaDue!: Date | null;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'enum', enum: Criticality, default: Criticality.Medium })
  priority!: Criticality;

  @Column({ type: 'uuid', nullable: true })
  projectId!: string | null;

  @ManyToOne(() => SecurityProject, (p) => p.tasks, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'projectId' })
  project!: SecurityProject | null;

  @Column({ type: 'uuid', nullable: true })
  parentTaskId!: string | null;

  @ManyToOne(() => Task, (t) => t.children, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentTaskId' })
  parentTask!: Task | null;

  @OneToMany(() => Task, (t) => t.parentTask)
  children!: Task[];

  @Column({ type: 'simple-array', nullable: true })
  labels!: string[] | null;

  @OneToMany(() => TaskComment, (c) => c.task)
  comments!: TaskComment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
