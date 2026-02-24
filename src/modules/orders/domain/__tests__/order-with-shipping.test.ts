import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { PrismaOrderRepository } from '../../infrastructure/repositories/prisma-order.repository';
import type { PrismaClient } from '@prisma/client';

// ─── Helpers ────────────────────────────────────────────────────────────────

const baseProps = {
  creatorId: 'creator-1',
  customerId: 'customer-1',
  customerName: 'Marie Dupont',
  customerEmail: 'marie@example.com',
  items: [
    OrderItem.create({
      productId: 'product-1',
      productName: 'Robe florale',
      price: 4999,
      quantity: 1,
    }).value,
  ],
  shippingAddress: {
    street: '10 rue de Rivoli',
    city: 'Paris',
    postalCode: '75001',
    country: 'France',
  },
};

// ─── Order.create() with shipping fields ────────────────────────────────────

describe('Order.create() with shipping fields', () => {
  it('crée un order avec shippingMode RELAY_POINT + relayPointId + relayPointName', () => {
    const result = Order.create({
      ...baseProps,
      shippingMode: 'RELAY_POINT',
      relayPointId: 'MR-75001',
      relayPointName: 'Tabac Presse Châtelet',
      shippingCost: 350,
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.shippingMode).toBe('RELAY_POINT');
    expect(result.value.relayPointId).toBe('MR-75001');
    expect(result.value.relayPointName).toBe('Tabac Presse Châtelet');
    expect(result.value.shippingCost).toBe(350);
  });

  it('crée un order avec shippingMode HOME_DELIVERY sans relayPoint', () => {
    const result = Order.create({
      ...baseProps,
      shippingMode: 'HOME_DELIVERY',
      shippingCost: 599,
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.shippingMode).toBe('HOME_DELIVERY');
    expect(result.value.relayPointId).toBeUndefined();
    expect(result.value.relayPointName).toBeUndefined();
    expect(result.value.shippingCost).toBe(599);
  });

  it('crée un order sans champs shipping (rétrocompatibilité)', () => {
    const result = Order.create(baseProps);

    expect(result.isSuccess).toBe(true);
    expect(result.value.shippingMode).toBeUndefined();
    expect(result.value.relayPointId).toBeUndefined();
    expect(result.value.relayPointName).toBeUndefined();
    expect(result.value.shippingCost).toBeUndefined();
  });

  it('accepte shippingCost à 0 (livraison gratuite)', () => {
    const result = Order.create({
      ...baseProps,
      shippingMode: 'HOME_DELIVERY',
      shippingCost: 0,
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.shippingCost).toBe(0);
  });
});

// ─── PrismaOrderRepository.save() with shipping fields ──────────────────────

describe('PrismaOrderRepository.save() with shipping fields', () => {
  const mockUpsert = vi.fn().mockResolvedValue(undefined);
  const mockFindUnique = vi.fn().mockResolvedValue(null); // no existing record
  const mockDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
  const mockCreateMany = vi.fn().mockResolvedValue({ count: 1 });

  const mockTx = {
    order: { findUnique: mockFindUnique, upsert: mockUpsert },
    orderItem: { deleteMany: mockDeleteMany, createMany: mockCreateMany },
  };

  const mockPrisma = {
    $transaction: vi.fn().mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) =>
      fn(mockTx)
    ),
  } as unknown as PrismaClient;

  const repo = new PrismaOrderRepository(mockPrisma);

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUnique.mockResolvedValue(null);
  });

  it('persiste shippingMode, relayPointId, relayPointName, shippingCost', async () => {
    const order = Order.create({
      ...baseProps,
      shippingMode: 'RELAY_POINT',
      relayPointId: 'MR-75001',
      relayPointName: 'Tabac Presse Châtelet',
      shippingCost: 350,
    }).value;

    await repo.save(order);

    expect(mockUpsert).toHaveBeenCalledOnce();
    const upsertCall = mockUpsert.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(upsertCall['create']).toMatchObject({
      shippingMode: 'RELAY_POINT',
      relayPointId: 'MR-75001',
      relayPointName: 'Tabac Presse Châtelet',
      shippingCost: 350,
    });
  });

  it('persiste null pour les champs shipping absents', async () => {
    const order = Order.create(baseProps).value;

    await repo.save(order);

    const upsertCall = mockUpsert.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(upsertCall['create']).toMatchObject({
      shippingMode: null,
      relayPointId: null,
      relayPointName: null,
      shippingCost: null,
    });
  });
});

// ─── PrismaOrderRepository.findById() with shipping fields ──────────────────

describe('PrismaOrderRepository.findById() with shipping fields', () => {
  const mockFindUnique = vi.fn();
  const mockPrisma = {
    order: { findUnique: mockFindUnique },
  } as unknown as PrismaClient;

  const repo = new PrismaOrderRepository(mockPrisma);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reconstitue un order avec les champs shipping depuis Prisma', async () => {
    const now = new Date();
    mockFindUnique.mockResolvedValue({
      id: 'order-1',
      orderNumber: 'ORD-TEST-0001',
      creatorId: 'creator-1',
      customerId: 'customer-1',
      customerName: 'Marie Dupont',
      customerEmail: 'marie@example.com',
      status: 'PENDING',
      totalAmount: 4999,
      shippingStreet: '10 rue de Rivoli',
      shippingCity: 'Paris',
      shippingPostalCode: '75001',
      shippingCountry: 'France',
      shippingMode: 'RELAY_POINT',
      relayPointId: 'MR-75001',
      relayPointName: 'Tabac Presse Châtelet',
      shippingCost: 350,
      stripePaymentIntentId: null,
      stripeRefundId: null,
      trackingNumber: null,
      carrier: null,
      cancellationReason: null,
      shippedAt: null,
      deliveredAt: null,
      createdAt: now,
      updatedAt: now,
      items: [],
    });

    const order = await repo.findById('order-1');

    expect(order).not.toBeNull();
    expect(order!.shippingMode).toBe('RELAY_POINT');
    expect(order!.relayPointId).toBe('MR-75001');
    expect(order!.relayPointName).toBe('Tabac Presse Châtelet');
    expect(order!.shippingCost).toBe(350);
  });

  it('reconstitue un order sans champs shipping (null → undefined)', async () => {
    const now = new Date();
    mockFindUnique.mockResolvedValue({
      id: 'order-2',
      orderNumber: 'ORD-TEST-0002',
      creatorId: 'creator-1',
      customerId: 'customer-1',
      customerName: 'Jean Martin',
      customerEmail: 'jean@example.com',
      status: 'PAID',
      totalAmount: 8900,
      shippingStreet: '5 avenue Foch',
      shippingCity: 'Lyon',
      shippingPostalCode: '69001',
      shippingCountry: 'France',
      shippingMode: null,
      relayPointId: null,
      relayPointName: null,
      shippingCost: null,
      stripePaymentIntentId: 'pi_test_123',
      stripeRefundId: null,
      trackingNumber: null,
      carrier: null,
      cancellationReason: null,
      shippedAt: null,
      deliveredAt: null,
      createdAt: now,
      updatedAt: now,
      items: [],
    });

    const order = await repo.findById('order-2');

    expect(order).not.toBeNull();
    expect(order!.shippingMode).toBeUndefined();
    expect(order!.relayPointId).toBeUndefined();
    expect(order!.relayPointName).toBeUndefined();
    expect(order!.shippingCost).toBeUndefined();
  });
});
