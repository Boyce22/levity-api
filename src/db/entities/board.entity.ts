import { Entity, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, PrimaryColumn, JoinColumn } from 'typeorm';
import { generateUUID } from '../../shared/index';
import { Workspace } from './workspace.entity';
import { BoardMember } from './board-member.entity';
import { BoardColumn } from './board-column.entity';
import { Sprint } from './sprint.entity';

@Entity('boards')
export class Board {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'uuid' })
  workspace_id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'float', default: 0 })
  position!: number;

  @Column({ type: 'uuid' })
  created_by!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null;

  @ManyToOne(() => Workspace, (w) => w.boards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace!: Workspace;

  @OneToMany(() => BoardMember, (m) => m.board)
  members!: BoardMember[];

  @OneToMany(() => BoardColumn, (c) => c.board)
  columns!: BoardColumn[];

  @OneToMany(() => Sprint, (s) => s.board)
  sprints!: Sprint[];
}
