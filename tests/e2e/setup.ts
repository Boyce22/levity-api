import { beforeAll, beforeEach } from 'vitest';
import { getTestApp } from '../helpers/app';
import { truncateAll } from '../helpers/db';
import { inMemoryStorage } from '../helpers/in-memory-storage';

beforeAll(async () => {
  await getTestApp();
});

beforeEach(async () => {
  await truncateAll();
  inMemoryStorage.clear();
});
