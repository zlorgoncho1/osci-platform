import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('integration_configs')
export class IntegrationConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  type!: string;

  @Column()
  name!: string;

  @Column({ type: 'json' })
  config!: Record<string, unknown>;

  @Column({ default: true })
  enabled!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
