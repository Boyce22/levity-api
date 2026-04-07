import { env } from "./env";
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  schema: env.DB_SCHEMA,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  synchronize: env.NODE_ENV === 'development',
  logging: env.NODE_ENV === 'development',
  entities: [__dirname + '/../modules/**/entities/*.entity.{ts,js}'],
  migrations: [__dirname + '/../database/migrations/*.{ts,js}'],
  subscribers: [],
});
