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
import { UserGroup } from './user-group.entity';

@Entity('group_permissions')
@Unique(['groupId', 'resourceType'])
export class GroupPermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  groupId!: string;

  @ManyToOne(() => UserGroup, (g) => g.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group!: UserGroup;

  @Column({ type: 'enum', enum: ResourceType })
  resourceType!: ResourceType;

  @Column({ type: 'simple-array' })
  actions!: Action[];

  @CreateDateColumn()
  createdAt!: Date;
}
