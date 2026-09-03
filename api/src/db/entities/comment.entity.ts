import { Entity, Column, ManyToOne, OneToMany, CreateDateColumn, PrimaryColumn, JoinColumn } from 'typeorm';
import { generateUUID } from '../../shared/index';
import { Card } from './card.entity';

@Entity('comments')
export class Comment {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'uuid' })
  card_id!: string;

  @Column({ type: 'uuid' })
  created_by!: string;

  @Column({ type: 'uuid', nullable: true })
  parent_id?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @ManyToOne(() => Card, (card) => card.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card!: Card;

  @ManyToOne(() => Comment, (c) => c.replies, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent?: Comment;

  @OneToMany(() => Comment, (c) => c.parent)
  replies!: Comment[];
}
