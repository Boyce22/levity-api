import pino from 'pino';
import { AppDataSource } from '@config';
import { User } from '@/modules/users/entities/user.entity';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

const logger = pino({ name: 'auth' });
const userRepository = new UserRepository(AppDataSource.getRepository(User));
const authService = new AuthService(userRepository, logger);
const authController = new AuthController(authService);

export { authController };
export const authRouter = authController.router;
