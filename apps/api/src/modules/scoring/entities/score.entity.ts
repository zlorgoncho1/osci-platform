import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SecObject } from '../../objects/entities/object.entity';

@Entity('scores')
export class Score {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  objectId!: string;

  @ManyToOne(() => SecObject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'objectId' })
  object!: SecObject;

  @Column({ type: 'float' })
  value!: number;

  @Column({ type: 'json' })
  breakdown!: Record<string, number>;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  computedAt!: Date;
}
