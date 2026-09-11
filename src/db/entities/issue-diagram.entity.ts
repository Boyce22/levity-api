import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { generateUUID } from '../../shared/index';
import { Issue } from './issue.entity';

@Entity('issue_diagrams')
export class IssueDiagram {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'uuid', unique: true })
  issue_id!: string;

  @Column({ type: 'jsonb' })
  data!: object;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @ManyToOne(() => Issue, (issue) => issue.diagram, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issue_id' })
  issue!: Issue;
}
