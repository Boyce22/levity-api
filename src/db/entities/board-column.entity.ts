import { Entity, Column, ManyToOne, OneToMany, CreateDateColumn, PrimaryColumn, JoinColumn } from 'typeorm';
import { generateUUID } from '../../shared/index';
import { BoardColumnType } from '../../contracts/index';
import { Board } from './board.entity';
import { Issue } from './issue.entity';

@Entity('board_columns')
export class BoardColumn {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'uuid' })
  board_id!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'float', default: 0 })
  position!: number;

  @Column({ type: 'int', nullable: true })
  wip_limit?: number | null;

  @Column({
    type: 'enum',
    enum: BoardColumnType,
    enumName: 'board_column_type_enum',
    nullable: true,
  })
  column_type?: BoardColumnType | null;

  @Column({ type: 'uuid' })
  created_by!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @ManyToOne(() => Board, (b) => b.columns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'board_id' })
  board!: Board;

  @OneToMany(() => Issue, (issue) => issue.column)
  issues!: Issue[];
}
