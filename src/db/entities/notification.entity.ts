import { Entity, Column, CreateDateColumn, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { generateUUID } from '../../shared/index';
import { NotificationType } from '../../contracts/index';
import { User } from './user.entity';
import { Issue } from './issue.entity';

@Entity('notifications')
export class Notification {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'uuid', nullable: true })
  actor_id?: string | null;

  @Column({ type: 'uuid', nullable: true })
  issue_id?: string | null;

  @Column({ type: 'enum', enum: NotificationType, enumName: 'notifications_type_enum' })
  type!: NotificationType;

  @Column({ type: 'boolean', default: false })
  read!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actor_id' })
  actor?: User | null;

  @ManyToOne(() => Issue, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issue_id' })
  issue?: Issue | null;
}
