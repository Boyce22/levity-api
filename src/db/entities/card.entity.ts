import { Entity, Column, ManyToOne, OneToMany, CreateDateColumn, PrimaryColumn, JoinColumn } from 'typeorm';
import { generateUUID } from '../../shared/index';
import { List } from './list.entity';
import { Comment } from './comment.entity';
import { CardHistory } from './card-history.entity';

export type CardWithCount = Card & { comment_count: number };

@Entity('cards')
export class Card {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'varchar' })
  content!: string;

  @Column({ type: 'float', default: 0 })
  position!: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', nullable: true })
  cover_url?: string;

  @Column({ type: 'uuid', nullable: true })
  assignee_id?: string;

  @Column({ type: 'varchar', nullable: true })
  priority?: string;

  @Column({ type: 'varchar', nullable: true })
  label?: string;

  @Column({ type: 'int', nullable: true, default: 0 })
  progress?: number;

  @Column({ type: 'timestamptz', nullable: true })
  due_date?: Date;

  @Column({ type: 'uuid' })
  list_id!: string;

  @Column({ type: 'int', nullable: true })
  story_points?: number;

  @Column({ type: 'float', nullable: true })
  estimated_hours?: number;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at?: Date;

  @Column({ type: 'uuid' })
  created_by!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @ManyToOne(() => List, (list) => list.cards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'list_id' })
  list!: List;

  @OneToMany(() => Comment, (comment) => comment.card)
  comments!: Comment[];

  @OneToMany(() => CardHistory, (h) => h.card)
  history!: CardHistory[];
}
