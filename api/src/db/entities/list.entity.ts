import { Entity, Column, ManyToOne, OneToMany, CreateDateColumn, PrimaryColumn, JoinColumn } from 'typeorm';
import { generateUUID } from '../../shared/index';
import { ListType } from '../../contracts/index';
import { Card } from './card.entity';
import { Workspace } from './workspace.entity';

@Entity('lists')
export class List {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'float', default: 0 })
  position!: number;

  @Column({ type: 'int', nullable: true })
  wip_limit?: number;

  @Column({ type: 'enum', enum: ListType, nullable: true })
  list_type?: ListType;

  @Column({ type: 'uuid' })
  workspace_id!: string;

  @Column({ type: 'uuid' })
  created_by!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace!: Workspace;

  @OneToMany(() => Card, (card) => card.list)
  cards!: Card[];
}
