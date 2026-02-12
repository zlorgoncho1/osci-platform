import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserGroupMember } from './user-group-member.entity';
import { GroupRoleAssignment } from './group-role-assignment.entity';
import { GroupPermission } from './group-permission.entity';

@Entity('user_groups')
export class UserGroup {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @OneToMany(() => UserGroupMember, (m) => m.group, { cascade: true })
  members!: UserGroupMember[];

  @OneToMany(() => GroupRoleAssignment, (a) => a.group, { cascade: true })
  roleAssignments!: GroupRoleAssignment[];

  @OneToMany(() => GroupPermission, (p) => p.group, { cascade: true })
  permissions!: GroupPermission[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
