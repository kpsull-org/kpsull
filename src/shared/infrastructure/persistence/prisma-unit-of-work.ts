/**
 * Prisma Unit of Work - wraps prisma.$transaction() for transactional consistency.
 */

import type { PrismaClient } from '@prisma/client';
import type { UnitOfWork } from '@/shared/application/unit-of-work.interface';

export class PrismaUnitOfWork implements UnitOfWork {
  constructor(private readonly prisma: PrismaClient) {}

  async execute<T>(work: (tx: unknown) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx: unknown) => {
      return work(tx);
    });
  }
}
