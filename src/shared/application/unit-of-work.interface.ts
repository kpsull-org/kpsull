/**
 * Unit of Work interface for transactional consistency.
 * Wraps multiple repository operations in a single transaction.
 */
export interface UnitOfWork {
  execute<T>(work: (tx: unknown) => Promise<T>): Promise<T>;
}
