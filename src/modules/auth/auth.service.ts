import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Logger } from 'pino';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { UnauthorizedError } from '@errors';
import { env } from '@config';

export interface AuthTokens {
  accessToken: string;
  user: { id: string; userName: string };
}

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: Logger,
  ) {}

  async login(username: string, password: string): Promise<AuthTokens> {
    const user = await this.userRepository.findByUsername(username);
    if (!user) throw new UnauthorizedError('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    const accessToken = this.signToken(user.id, user.username);
    this.logger.info({ userId: user.id }, 'User logged in');
    return { accessToken, user: { id: user.id, userName: user.username } };
  }

  async register(username: string, password: string, email?: string): Promise<AuthTokens> {
    const hashed = await bcrypt.hash(password, 12);
    const user = await this.userRepository.create({ username, password: hashed, email });

    const accessToken = this.signToken(user.id, user.username);
    this.logger.info({ userId: user.id }, 'User registered');
    return { accessToken, user: { id: user.id, userName: user.username } };
  }

  private signToken(id: string, username: string): string {
    return jwt.sign({ id, username }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }
}
