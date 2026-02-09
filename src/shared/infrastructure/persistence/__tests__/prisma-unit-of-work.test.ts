import { describe, it, expect, vi } from 'vitest';
import { PrismaUnitOfWork } from '../prisma-unit-of-work';
import type { PrismaClient } from '@prisma/client';

describe('PrismaUnitOfWork', () => {
  it('should delegate to prisma.$transaction', async () => {
    const mockTx = { user: { findMany: vi.fn() } };
    const mockPrisma = {
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(mockTx)),
    } as unknown as PrismaClient;

    const uow = new PrismaUnitOfWork(mockPrisma);

    const result = await uow.execute(async (tx) => {
      expect(tx).toBe(mockTx);
      return 'transaction-result';
    });

    expect(result).toBe('transaction-result');
    expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
  });

  it('should propagate errors from the transaction', async () => {
    const mockPrisma = {
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
    } as unknown as PrismaClient;

    const uow = new PrismaUnitOfWork(mockPrisma);

    await expect(
      uow.execute(async () => {
        throw new Error('transaction-error');
      })
    ).rejects.toThrow('transaction-error');
  });
});
