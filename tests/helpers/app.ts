import type { AppInstance } from '../../src/app';
import { buildApp } from '../../src/app';
import { createApiContainer, type ApiContainer } from '../../src/composition';
import { AppDataSource } from '../../src/db/data-source';
import { inMemoryStorage } from './in-memory-storage';

let app: AppInstance | undefined;
let container: ApiContainer | undefined;

export async function getTestApp(): Promise<AppInstance> {
  if (app) return app;

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  inMemoryStorage.clear();
  container = createApiContainer({ storage: inMemoryStorage });
  app = await buildApp(container);
  await app.ready();
  return app;
}

export async function closeTestApp(): Promise<void> {
  if (app) {
    await app.close();
    app = undefined;
  }
  if (container) {
    await container.close();
    container = undefined;
  }
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}
