import { IsNull, type Repository } from 'typeorm';
import { MembershipStatus } from '../../contracts/index';
import { NotFoundError, ConflictError } from '../../shared/index';
import { type User } from '../entities/user.entity';

export type UpdateUserProfileInput = Partial<Pick<User, 'first_name' | 'last_name' | 'avatar_url' | 'bio' | 'email'>>;

export class UserRepository {
  constructor(private readonly repository: Repository<User>) {}

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.repository.findOne({ where: { username, deleted_at: IsNull() } });
  }

  async findByWorkspace(workspaceId: string, search?: string): Promise<User[]> {
    const query = this.repository
      .createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.first_name', 'user.last_name', 'user.avatar_url'])
      .innerJoin('workspace_members', 'wm', 'wm.user_id = user.id')
      .where('wm.workspace_id = :workspaceId', { workspaceId })
      .andWhere('wm.membership_status = :status', { status: MembershipStatus.ACTIVE })
      .andWhere('user.deleted_at IS NULL');

    if (search) {
      query.andWhere(
        '(user.username ILIKE :search OR user.first_name ILIKE :search OR user.last_name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    return query.getMany();
  }

  async create(data: { username: string; password: string; email?: string }): Promise<User> {
    const existing = await this.findByUsername(data.username);
    if (existing) throw new ConflictError('Username already taken');

    const user = this.repository.create(data);
    return this.repository.save(user);
  }

  async update(id: string, input: UpdateUserProfileInput): Promise<User> {
    const user = await this.findByIdOrFail(id);
    Object.assign(user, input);
    return this.repository.save(user);
  }

  async touchLastLogin(id: string): Promise<void> {
    await this.repository.update(id, { last_login_at: new Date() });
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }
}
