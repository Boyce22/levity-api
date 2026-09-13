import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    fileParallelism: false,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    testTimeout: 30_000,
    hookTimeout: 60_000,
    globalSetup: ['./tests/setup/global.ts'],
    setupFiles: ['./tests/setup/reflect.ts'],
    env: {
      NODE_ENV: 'test',
      DB_NAME: 'levity_test',
      JWT_SECRET: 'test-jwt-secret-at-least-32-chars!!',
      JWT_EXPIRES_IN: '24h',
      LOG_LEVEL: 'fatal',
      STORAGE_PROVIDER: 's3',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/db/migrations/**',
        'src/**/*.d.ts',
        'src/modules/files/storage/types/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        'src/modules/**/*.controller.ts': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
        'src/modules/**/*.service.ts': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
        'src/db/repositories/**/*.ts': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
  },
});
