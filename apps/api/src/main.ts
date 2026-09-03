import 'reflect-metadata';

import { env } from '@levity/config';
import { createProcessLifecycle } from '@levity/observability';
import { AppDataSource } from './db/data-source';
import { buildApp } from './app';
import { createApiContainer } from './composition';

const PROCESS_NAME = 'api';

async function startApi(): Promise<void> {
  const container = createApiContainer();
  const lifecycle = createProcessLifecycle({
    processName: PROCESS_NAME,
    logger: container.logger,
    dataSource: AppDataSource,
  });

  try {
    await lifecycle.initialize();
    const app = await buildApp(container);
    await app.listen({ port: env.PORT, host: '0.0.0.0' });

    container.logger.info({ process: PROCESS_NAME, port: env.PORT }, 'API runtime started');

    lifecycle.installGracefulShutdown(async () => {
      await app.close();
      await container.close();
    });
  } catch (err) {
    await lifecycle.handleStartupFailure(err);
  }
}

void startApi();
