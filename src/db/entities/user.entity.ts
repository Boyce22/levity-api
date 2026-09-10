import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';
import { generateUUID } from '../../shared/index';
import { AccountStatus } from '../../contracts/index';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'varchar' })
  username!: string;

  @Column({ type: 'varchar' })
  password!: string;

  @Column({ type: 'varchar', nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', nullable: true })
  first_name?: string | null;

  @Column({ type: 'varchar', nullable: true })
  last_name?: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatar_url?: string | null;

  @Column({ type: 'text', nullable: true })
  bio?: string | null;

  @Column({
    type: 'enum',
    enum: AccountStatus,
    enumName: 'users_account_status_enum',
    default: AccountStatus.ACTIVE,
  })
  account_status!: AccountStatus;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  last_login_at?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
