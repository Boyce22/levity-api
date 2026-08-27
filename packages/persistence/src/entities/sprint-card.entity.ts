import { Entity, Column, ManyToOne, PrimaryColumn, JoinColumn } from 'typeorm';
import { generateUUID } from '@levity/observability';
import { Card } from './card.entity';
import { Sprint } from './sprint.entity';

@Entity('sprint_cards')
export class SprintCard {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'uuid' })
  sprint_id!: string;

  @Column({ type: 'uuid' })
  card_id!: string;

  @Column({ type: 'int', default: 0 })
  position!: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  added_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  removed_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  moved_to_sprint_id?: string;

  @ManyToOne(() => Sprint, (s) => s.sprint_cards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sprint_id' })
  sprint!: Sprint;

  @ManyToOne(() => Card, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card!: Card;

  @ManyToOne(() => Sprint, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'moved_to_sprint_id' })
  moved_to_sprint?: Sprint;
}
