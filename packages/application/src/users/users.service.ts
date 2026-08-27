import type { Logger } from 'pino';
import type { UpdateUserInput, UserResponse, UserPublicResponse } from '@levity/domain';
import type { User, UserRepository } from '@levity/persistence';

export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: Logger,
  ) {}

  async getProfile(userId: string): Promise<UserResponse> {
    const user = await this.userRepository.findByIdOrFail(userId);
    return toUserResponse(user);
  }

  async getUsersByWorkspace(workspaceId: string): Promise<UserPublicResponse[]> {
    const users = await this.userRepository.findByWorkspace(workspaceId);
    return users.map(toUserPublicResponse);
  }

  async updateProfile(userId: string, input: UpdateUserInput): Promise<UserResponse> {
    const user = await this.userRepository.update(userId, input);
    this.logger.info({ userId }, 'User profile updated');
    return toUserResponse(user);
  }
}

function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    bio: user.bio,
    email: user.email,
    created_at: user.created_at.toISOString(),
  };
}

function toUserPublicResponse(user: User): UserPublicResponse {
  return {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
  };
}
