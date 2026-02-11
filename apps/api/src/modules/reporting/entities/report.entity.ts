import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column()
  type!: string;

  @Column({ type: 'json', nullable: true })
  filters!: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  content!: Record<string, unknown> | null;

  @Column()
  generatedById!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
