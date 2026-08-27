import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';
import { generateUUID } from '@levity/observability';

@Entity('diagrams')
export class Diagram {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'uuid', unique: true })
  card_id!: string;

  @Column({ type: 'jsonb' })
  data!: object;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
