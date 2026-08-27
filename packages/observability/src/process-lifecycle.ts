import type { Logger } from 'pino';

export interface ClosableDataSource {
  readonly isInitialized: boolean;
  initialize(): Promise<unknown>;
  destroy(): Promise<unknown>;
}

export interface ProcessLifecycleOptions {
  processName: string;
  logger: Logger;
  dataSource: ClosableDataSource;
}

type CloseRuntime = () => Promise<unknown>;

export interface ProcessLifecycle {
  initialize(): Promise<void>;
  installGracefulShutdown(closeRuntime: CloseRuntime): void;
  handleStartupFailure(err: unknown): Promise<never>;
}

export function createProcessLifecycle({
  processName,
  logger,
  dataSource,
}: ProcessLifecycleOptions): ProcessLifecycle {
  return {
    async initialize(): Promise<void> {
      logger.info({ process: processName }, 'Connecting to database');
      await dataSource.initialize();
      logger.info({ process: processName }, 'Database connected');
    },

    installGracefulShutdown(closeRuntime: CloseRuntime): void {
      let shutdownPromise: Promise<void> | null = null;

      const shutdown = (reason: string, exitCode: number): Promise<void> => {
        if (shutdownPromise) return shutdownPromise;

        shutdownPromise = (async () => {
          logger.info({ process: processName, reason }, 'Shutting down runtime');
          try {
            await closeRuntime();
            if (dataSource.isInitialized) await dataSource.destroy();
            logger.info({ process: processName }, 'Runtime shutdown complete');
            process.exit(exitCode);
          } catch (err) {
            logger.error({ err, process: processName }, 'Runtime shutdown failed');
            process.exit(1);
          }
        })();

        return shutdownPromise;
      };

      process.once('SIGTERM', () => void shutdown('SIGTERM', 0));
      process.once('SIGINT', () => void shutdown('SIGINT', 0));
      process.once('uncaughtException', (err) => {
        logger.fatal({ err, process: processName }, 'Uncaught exception');
        void shutdown('uncaughtException', 1);
      });
      process.once('unhandledRejection', (reason) => {
        logger.fatal({ reason, process: processName }, 'Unhandled rejection');
        void shutdown('unhandledRejection', 1);
      });
    },

    async handleStartupFailure(err: unknown): Promise<never> {
      logger.fatal({ err, process: processName }, 'Runtime failed to start');
      if (dataSource.isInitialized) {
        await dataSource.destroy().catch(() => undefined);
      }
      process.exit(1);
    },
  };
}
