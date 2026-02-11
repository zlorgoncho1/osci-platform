import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  action!: string;

  @Column()
  actorId!: string;

  @Column({ type: 'varchar', nullable: true })
  objectType!: string | null;

  @Column({ type: 'varchar', nullable: true })
  objectId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  decision!: string | null;

  @Column({ type: 'varchar', nullable: true })
  policyRule!: string | null;

  @Column({ type: 'json', nullable: true })
  context!: Record<string, unknown> | null;

  @Column({ type: 'varchar', nullable: true })
  ipAddress!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
