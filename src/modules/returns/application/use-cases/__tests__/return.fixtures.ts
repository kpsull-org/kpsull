import { vi, expect, type Mock } from 'vitest';
import type { ReturnRequest, ReturnRepository } from '../../ports/return.repository.interface';

export type MockReturnRepository = {
  [K in keyof ReturnRepository]: Mock;
};

export function createMockReturnRepository(): MockReturnRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByOrderId: vi.fn(),
    findByCreatorId: vi.fn(),
    findByCustomerId: vi.fn(),
    delete: vi.fn(),
  };
}

export function createBaseReturnRequest(overrides: Partial<ReturnRequest> = {}): ReturnRequest {
  return {
    id: 'return-1',
    orderId: 'order-1',
    orderNumber: 'KPS-2024-001',
    creatorId: 'creator-123',
    customerId: 'customer-1',
    customerName: 'Jean Dupont',
    customerEmail: 'jean@example.com',
    reason: 'DEFECTIVE',
    status: 'REQUESTED',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createRequestedReturn(): ReturnRequest {
  return createBaseReturnRequest({ status: 'REQUESTED' });
}

export function createApprovedReturn(): ReturnRequest {
  return createBaseReturnRequest({
    status: 'APPROVED',
    approvedAt: new Date(),
  });
}

export function createShippedBackReturn(): ReturnRequest {
  return createBaseReturnRequest({
    status: 'SHIPPED_BACK',
    trackingNumber: 'TRACK-123',
    carrier: 'Colissimo',
    approvedAt: new Date(),
    shippedAt: new Date(),
  });
}

export function createReceivedReturn(): ReturnRequest {
  return createBaseReturnRequest({
    status: 'RECEIVED',
    trackingNumber: 'TRACK-123',
    carrier: 'Colissimo',
    approvedAt: new Date(),
    shippedAt: new Date(),
    receivedAt: new Date(),
  });
}

type SimpleReturnInput = { returnId: string; creatorId: string };
type SimpleExecuteFn = (input: SimpleReturnInput) => Promise<{ isFailure: boolean; error?: string }>;

export async function assertFailsWhenReturnNotFound(
  executeFn: SimpleExecuteFn,
  mockRepository: MockReturnRepository
): Promise<void> {
  mockRepository.findById.mockResolvedValue(null);

  const result = await executeFn({ returnId: 'non-existent', creatorId: 'creator-123' });

  expect(result.isFailure).toBe(true);
  expect(result.error).toContain('non trouvee');
}

export async function assertFailsWhenNotCreatorOwner(
  executeFn: SimpleExecuteFn,
  mockRepository: MockReturnRepository,
  returnFixture: ReturnRequest
): Promise<void> {
  mockRepository.findById.mockResolvedValue(returnFixture);

  const result = await executeFn({ returnId: 'return-1', creatorId: 'different-creator' });

  expect(result.isFailure).toBe(true);
  expect(result.error).toContain('autorise');
}
