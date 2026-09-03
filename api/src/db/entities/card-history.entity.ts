import { Entity, Column, ManyToOne, CreateDateColumn, PrimaryColumn, JoinColumn } from 'typeorm';
import { generateUUID } from '../../shared/index';
import { Card } from './card.entity';

@Entity('card_history')
export class CardHistory {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'uuid' })
  card_id!: string;

  @Column({ type: 'uuid' })
  created_by!: string;

  @Column()
  action_type!: string;

  @Column()
  field!: string;

  @Column({ nullable: true })
  old_val?: string;

  @Column({ nullable: true })
  new_val?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @ManyToOne(() => Card, (card) => card.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card!: Card;
}
