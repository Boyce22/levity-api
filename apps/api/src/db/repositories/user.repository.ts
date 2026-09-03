import type { Repository } from 'typeorm';
import type { UpdateUserInput } from '../../domain/index';
import { NotFoundError, ConflictError } from '../../observability/index';
import { type User } from '../entities/user.entity';

export class UserRepository {
  constructor(private readonly repository: Repository<User>) {}

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.repository.findOne({ where: { username } });
  }

  async findByWorkspace(workspaceId: string, search?: string): Promise<User[]> {
    const query = this.repository
      .createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.display_name', 'user.avatar_url'])
      .innerJoin('workspace_members', 'wm', 'wm.user_id = user.id')
      .where('wm.workspace_id = :workspaceId', { workspaceId });

    if (search) {
      query.andWhere('(user.username ILIKE :search OR user.display_name ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    return query.getMany();
  }

  async create(data: { username: string; password: string; email?: string }): Promise<User> {
    const existing = await this.findByUsername(data.username);
    if (existing) throw new ConflictError('Username already taken');

    const user = this.repository.create(data);
    return this.repository.save(user);
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const user = await this.findByIdOrFail(id);
    Object.assign(user, input);
    return this.repository.save(user);
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }
}
