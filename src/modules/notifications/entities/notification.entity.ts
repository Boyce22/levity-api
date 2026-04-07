import { UUID } from '@utils';
import { NotificationType } from '@/shared/enums/notification-type.enum';
import { Entity, Column, CreateDateColumn, PrimaryColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryColumn('uuid')
  id: string = UUID.generate();

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
