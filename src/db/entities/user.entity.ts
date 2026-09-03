import { Entity, Column, CreateDateColumn, PrimaryColumn } from 'typeorm';
import { generateUUID } from '../../shared/index';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'varchar', unique: true })
  username!: string;

  @Column({ type: 'varchar' })
  password!: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  email?: string;

  @Column({ type: 'varchar', nullable: true })
  display_name?: string;

  @Column({ type: 'varchar', nullable: true })
  avatar_url?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
