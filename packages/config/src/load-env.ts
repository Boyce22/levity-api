import { existsSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

/**
 * Load the nearest `.env` walking up from cwd and from this package.
 * Workspace scripts run with cwd at `packages/*` while the monorepo `.env`
 * lives at the repo root.
 */
export function loadEnvFile(): void {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '../.env'),
    resolve(process.cwd(), '../../.env'),
    resolve(__dirname, '../../../.env'),
    resolve(__dirname, '../../../../.env'),
  ];

  for (const path of candidates) {
    if (existsSync(path)) {
      config({ path });
      return;
    }
  }

  config();
}

loadEnvFile();
