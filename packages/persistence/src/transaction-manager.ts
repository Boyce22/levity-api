import type { EntityManager } from 'typeorm';
import { AppDataSource } from './data-source';

export class TransactionManager {
  constructor(private readonly dataSource = AppDataSource) {}

  runInTransaction<T>(work: (manager: EntityManager) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(work);
  }
}
