import type { ReturnRequest } from '../../ports/return.repository.interface';

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
