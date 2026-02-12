import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ResourceType, Action } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';

@Entity('user_permissions')
@Unique(['userId', 'resourceType'])
export class UserPermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'enum', enum: ResourceType })
  resourceType!: ResourceType;

  @Column({ type: 'simple-array' })
  actions!: Action[];

  @Column({ type: 'uuid', nullable: true })
  grantedById!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'grantedById' })
  grantedBy!: User | null;

  @CreateDateColumn()
  createdAt!: Date;
}
