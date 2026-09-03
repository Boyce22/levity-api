import { Entity, Column, CreateDateColumn, PrimaryColumn } from 'typeorm';
import { generateUUID } from '../../shared/index';
import { NotificationType } from '../../domain/index';

@Entity('notifications')
export class Notification {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'uuid' })
  actor_id!: string;

  @Column({ type: 'uuid' })
  card_id!: string;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column({ type: 'text' })
  content!: string;

  @Column({ default: false })
  read!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
