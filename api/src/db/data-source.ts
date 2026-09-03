import 'reflect-metadata';

import { DataSource } from 'typeorm';
import { env, resolveDbPoolMax } from '../config/index';
import { entities } from './entities';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  schema: env.DB_SCHEMA,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  synchronize: false,
  logging: env.NODE_ENV !== 'production',
  poolSize: resolveDbPoolMax(),
  entities,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
