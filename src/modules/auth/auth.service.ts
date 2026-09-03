import jwt, { type SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Logger } from 'pino';
import type { AuthTokens } from '../../contracts';
import { UnauthorizedError } from '../../shared';
import type { UserRepository } from '../../db';

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: Logger,
    private readonly jwtSecret: string,
    private readonly jwtExpiresIn: string,
  ) {}

  async login(username: string, password: string): Promise<AuthTokens> {
    const user = await this.userRepository.findByUsername(username);
    if (!user) throw new UnauthorizedError('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    const accessToken = this.signToken(user.id, user.username);
    this.logger.info({ userId: user.id }, 'User logged in');
    return { accessToken, user: { id: user.id, username: user.username } };
  }

  async register(username: string, password: string, email?: string): Promise<AuthTokens> {
    const hashed = await bcrypt.hash(password, 12);
    const user = await this.userRepository.create({ username, password: hashed, email });

    const accessToken = this.signToken(user.id, user.username);
    this.logger.info({ userId: user.id }, 'User registered');
    return { accessToken, user: { id: user.id, username: user.username } };
  }

  verifyAccessToken(token: string): { id: string; username: string } {
    return jwt.verify(token, this.jwtSecret) as { id: string; username: string };
  }

  private signToken(id: string, username: string): string {
    return jwt.sign({ id, username }, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    } as SignOptions);
  }
}
