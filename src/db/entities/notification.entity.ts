import { Entity, Column, CreateDateColumn, PrimaryColumn } from 'typeorm';
import { generateUUID } from '../../shared/index';
import { NotificationType } from '../../contracts/index';

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
}
