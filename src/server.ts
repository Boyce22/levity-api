import 'reflect-metadata';
import app from './app';
import { Server as HttpServer } from 'http';

import { logger } from '@utils';
import { AppDataSource, env } from '@config';

class Server {
  private readonly port: number;
  private readonly shutdownTimeout = 10000;
  private httpServer?: HttpServer;

  constructor() {
    this.port = env.PORT;
  }

  async start(): Promise<void> {
    try {
      await this.initializeDatabase();
      await this.startHttpServer();
      this.setupGracefulShutdown();

      logger.info({ port: this.port, environment: env.NODE_ENV, url: `http://localhost:${this.port}` }, 'Server started successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to start server');
      process.exit(1);
    }
  }

  private async initializeDatabase(): Promise<void> {
    logger.info('Connecting to database...');
    await AppDataSource.initialize();
    logger.info('Database connected');
  }

  private async startHttpServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.httpServer = app.listen(this.port, () => {
        logger.info(`Server running on http://localhost:${this.port}`);
        resolve();
      });

      this.httpServer.on('error', (error) => {
        logger.error({ error }, 'Server error');
        reject(error);
      });
    });
  }

  private async closeHttpServer(): Promise<void> {
    if (!this.httpServer) return;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server shutdown timeout'));
      }, this.shutdownTimeout);

      this.httpServer!.close((error) => {
        clearTimeout(timeout);
        if (error) reject(error);
        else { logger.info('HTTP server closed'); resolve(); }
      });
    });
  }

  private async closeDatabase(): Promise<void> {
    if (!AppDataSource.isInitialized) return;
    logger.info('Closing database...');
    await AppDataSource.destroy();
    logger.info('Database closed');
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down...`);
      try {
        await this.closeHttpServer();
        await this.closeDatabase();
        logger.info('Shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error({ error }, 'Error during shutdown');
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      logger.error({ error }, 'Uncaught exception');
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      logger.error({ reason }, 'Unhandled rejection');
      process.exit(1);
    });
  }
}

new Server().start();
