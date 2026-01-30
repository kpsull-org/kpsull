/**
 * Error thrown when a concurrent modification is detected during save.
 * This implements optimistic locking using the updatedAt timestamp as version.
 */
export class ConcurrentModificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConcurrentModificationError';
  }
}
