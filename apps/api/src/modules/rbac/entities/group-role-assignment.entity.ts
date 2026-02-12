import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { UserGroup } from './user-group.entity';
import { Role } from './role.entity';

@Entity('group_role_assignments')
@Unique(['groupId', 'roleId'])
export class GroupRoleAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  groupId!: string;

  @ManyToOne(() => UserGroup, (g) => g.roleAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group!: UserGroup;

  @Column({ type: 'uuid' })
  roleId!: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role!: Role;

  @CreateDateColumn()
  createdAt!: Date;
}
