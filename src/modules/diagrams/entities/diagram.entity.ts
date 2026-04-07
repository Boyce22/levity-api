import { UUID } from '@utils';
import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';

@Entity('diagrams')
export class Diagram {
  @PrimaryColumn('uuid')
  id: string = UUID.generate();

  @Column({ type: 'uuid', unique: true })
  card_id!: string;

  @Column({ type: 'jsonb' })
  data!: object;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
