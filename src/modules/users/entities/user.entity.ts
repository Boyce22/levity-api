import { UUID } from '@utils';
import { Entity, Column, CreateDateColumn, PrimaryColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id: string = UUID.generate();

  @Column({ unique: true })
  username!: string;

  @Column()
  password!: string;

  @Column({ nullable: true, unique: true })
  email?: string;

  @Column({ nullable: true })
  display_name?: string;

  @Column({ nullable: true })
  avatar_url?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
