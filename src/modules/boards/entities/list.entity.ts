import { UUID } from '@utils';
import { ListType } from '@/shared/enums/list-type.enum';
import { Entity, Column, ManyToOne, OneToMany, CreateDateColumn, PrimaryColumn, JoinColumn } from 'typeorm';
import { Card } from './card.entity';
import { Workspace } from '@/modules/workspaces/entities/workspace.entity';

@Entity('lists')
export class List {
  @PrimaryColumn('uuid')
  id: string = UUID.generate();

  @Column()
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
