import pino from 'pino';
import { AppDataSource } from '@config';
import { User } from './entities/user.entity';
import { UserRepository } from './repositories/user.repository';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

const logger = pino({ name: 'users' });
const userRepository = new UserRepository(AppDataSource.getRepository(User));
const usersService = new UsersService(userRepository, logger);
const usersController = new UsersController(usersService);

export { usersController, userRepository };
export const usersRouter = usersController.router;
