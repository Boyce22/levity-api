import type { Logger } from 'pino';
import type { UpdateUserInput, UserResponse, UserPublicResponse } from '../../contracts/index';
import type { User, UserRepository } from '../../db/index';
import type { FilesService } from '../files/files.service';

export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly filesService: FilesService,
    private readonly logger: Logger,
  ) {}

  async getProfile(userId: string): Promise<UserResponse> {
    const user = await this.userRepository.findByIdOrFail(userId);
    const response = toUserResponse(user);
    response.avatar_url = await this.filesService.resolveUrl(user.avatar_url);
    return response;
  }

  async getUsersByWorkspace(workspaceId: string, search?: string): Promise<UserPublicResponse[]> {
    const users = await this.userRepository.findByWorkspace(workspaceId, search);
    const avatarKeys = users.filter((u) => u.avatar_url).map((u) => u.avatar_url!);
    const urlMap = await this.filesService.resolveUrls(avatarKeys);

    return users.map((u) => ({
      ...toUserPublicResponse(u),
      avatar_url: u.avatar_url ? urlMap.get(u.avatar_url) : undefined,
    }));
  }

  async updateProfile(userId: string, input: UpdateUserInput): Promise<UserResponse> {
    const user = await this.userRepository.update(userId, input);
    this.logger.info({ userId }, 'User profile updated');
    const response = toUserResponse(user);
    response.avatar_url = await this.filesService.resolveUrl(user.avatar_url);
    return response;
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
