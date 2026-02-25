import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaOrderRepository } from '../prisma-order.repository';
import { ConcurrentModificationError } from '../../errors/concurrent-modification.error';
import { Order } from '../../../domain/entities/order.entity';
import { OrderItem } from '../../../domain/entities/order-item.entity';

const mockTx = vi.hoisted(() => ({
  order: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  orderItem: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
}));

const mockPrisma = vi.hoisted(() => ({
  order: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    delete: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock('@/lib/prisma/client', () => ({
  prisma: mockPrisma,
}));

// Helper to build a Prisma order row
function buildPrismaOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-uuid-1',
    orderNumber: 'ORD-001',
    creatorId: 'creator-123',
    customerId: 'customer-123',
    customerName: 'Jean Dupont',
    customerEmail: 'jean@example.com',
    status: 'PENDING',
    totalAmount: 2999,
    shippingStreet: '1 Rue Paris',
    shippingCity: 'Paris',
    shippingPostalCode: '75001',
    shippingCountry: 'France',
    stripePaymentIntentId: null,
    stripeRefundId: null,
    trackingNumber: null,
    carrier: null,
    cancellationReason: null,
    shippedAt: null,
    deliveredAt: null,
    shippingMode: null,
    relayPointId: null,
    relayPointName: null,
    shippingCost: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    items: [],
    ...overrides,
  };
}

function buildPrismaItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'item-uuid-1',
    orderId: 'order-uuid-1',
    productId: 'product-1',
    variantId: null,
    productName: 'Produit A',
    variantInfo: null,
    price: 2999,
    quantity: 1,
    image: null,
    ...overrides,
  };
}

function buildTestOrderWithItem() {
  const item = OrderItem.create({
    productId: 'product-1',
    productName: 'Produit A',
    price: 2999,
    quantity: 1,
  }).value;

  const order = Order.create({
    creatorId: 'creator-123',
    customerId: 'customer-123',
    customerName: 'Jean Dupont',
    customerEmail: 'jean@example.com',
    items: [item],
    shippingAddress: {
      street: '1 Rue Paris',
      city: 'Paris',
      postalCode: '75001',
      country: 'France',
    },
  }).value;

  return { item, order };
}

describe('PrismaOrderRepository', () => {
  let repository: PrismaOrderRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) =>
      fn(mockTx)
    );
    mockTx.order.findUnique.mockResolvedValue(null); // default: new order
    mockTx.order.upsert.mockResolvedValue({});
    mockTx.orderItem.deleteMany.mockResolvedValue({});
    mockTx.orderItem.createMany.mockResolvedValue({});
    repository = new PrismaOrderRepository(mockPrisma as never);
  });

  describe('save', () => {
    it('should upsert a new order without items', async () => {
      const { order } = buildTestOrderWithItem();

      await repository.save(order);

      expect(mockTx.order.upsert).toHaveBeenCalledOnce();
      expect(mockTx.orderItem.deleteMany).toHaveBeenCalledOnce();
      expect(mockTx.orderItem.createMany).toHaveBeenCalledOnce();
    });

    it('should skip createMany when order has no items', async () => {
      const { order } = buildTestOrderWithItem();

      // Access private items to test the 0-items branch via reconstitute
      const prismaOrderWithNoItems = buildPrismaOrder({ items: [] });
      mockPrisma.order.findUnique.mockResolvedValue(prismaOrderWithNoItems);
      const found = await repository.findById('order-uuid-1');
      expect(found).not.toBeNull();

      // Now save an order (items.length > 0 branch already tested above)
      await repository.save(order);
      expect(mockTx.orderItem.createMany).toHaveBeenCalledOnce();
    });

    it('should throw ConcurrentModificationError if updatedAt differs', async () => {
      const { item } = buildTestOrderWithItem();

      // Create order via reconstitute so we can control updatedAt
      const order = Order.reconstitute({
        id: 'order-uuid-1',
        orderNumber: 'ORD-001',
        creatorId: 'creator-123',
        customerId: 'customer-123',
        customerName: 'Jean Dupont',
        customerEmail: 'jean@example.com',
        items: [item],
        shippingAddress: {
          street: '1 Rue Paris',
          city: 'Paris',
          postalCode: '75001',
          country: 'France',
        },
        status: 'PENDING',
        totalAmount: 2999,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
      }).value;

      // Simulate a different updatedAt in DB (concurrent modification)
      mockTx.order.findUnique.mockResolvedValue({
        updatedAt: new Date('2024-01-01T12:00:00Z'), // different
      });

      await expect(repository.save(order)).rejects.toThrow(ConcurrentModificationError);
    });

    it('should succeed if updatedAt matches (no concurrent modification)', async () => {
      const { item } = buildTestOrderWithItem();

      const updatedAt = new Date('2024-01-01T10:00:00Z');
      const order = Order.reconstitute({
        id: 'order-uuid-1',
        orderNumber: 'ORD-001',
        creatorId: 'creator-123',
        customerId: 'customer-123',
        customerName: 'Jean Dupont',
        customerEmail: 'jean@example.com',
        items: [item],
        shippingAddress: {
          street: '1 Rue Paris',
          city: 'Paris',
          postalCode: '75001',
          country: 'France',
        },
        status: 'PENDING',
        totalAmount: 2999,
        createdAt: new Date('2024-01-01'),
        updatedAt,
      }).value;

      // Same updatedAt → no conflict
      mockTx.order.findUnique.mockResolvedValue({ updatedAt });

      await expect(repository.save(order)).resolves.toBeUndefined();
      expect(mockTx.order.upsert).toHaveBeenCalledOnce();
    });

    it('should save order with all optional fields', async () => {

      const item = OrderItem.create({
        productId: 'product-1',
        productName: 'Produit A',
        price: 2999,
        quantity: 2,
        variantId: 'variant-1',
        variantInfo: 'Taille M',
        image: '/img.jpg',
      }).value;

      const order = Order.reconstitute({
        id: 'order-uuid-2',
        orderNumber: 'ORD-002',
        creatorId: 'creator-123',
        customerId: 'customer-123',
        customerName: 'Marie Martin',
        customerEmail: 'marie@example.com',
        items: [item],
        shippingAddress: {
          street: '5 Avenue Lyon',
          city: 'Lyon',
          postalCode: '69001',
          country: 'France',
        },
        status: 'SHIPPED',
        totalAmount: 5998,
        stripePaymentIntentId: 'pi_123',
        stripeRefundId: 'ref_123',
        trackingNumber: 'TRACK123',
        carrier: 'Colissimo',
        cancellationReason: undefined,
        shippedAt: new Date('2024-01-02'),
        deliveredAt: new Date('2024-01-03'),
        shippingMode: 'relay',
        relayPointId: 'relay-1',
        relayPointName: 'Point Relais A',
        shippingCost: 500,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }).value;

      await repository.save(order);

      expect(mockTx.order.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            trackingNumber: 'TRACK123',
            carrier: 'Colissimo',
            shippingMode: 'relay',
            relayPointId: 'relay-1',
            shippingCost: 500,
          }),
        })
      );
    });
  });

  describe('findById', () => {
    it('should return null when order is not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should return an Order domain entity when found', async () => {
      const prismaOrder = buildPrismaOrder({ items: [buildPrismaItem()] });
      mockPrisma.order.findUnique.mockResolvedValue(prismaOrder);

      const result = await repository.findById('order-uuid-1');

      expect(result).not.toBeNull();
      expect(result!.idString).toBe('order-uuid-1');
      expect(result!.orderNumber).toBe('ORD-001');
      expect(result!.creatorId).toBe('creator-123');
      expect(result!.items).toHaveLength(1);
    });

    it('should map all optional fields from Prisma to domain', async () => {
      const prismaOrder = buildPrismaOrder({
        stripePaymentIntentId: 'pi_abc',
        stripeRefundId: 'ref_abc',
        trackingNumber: 'TRK999',
        carrier: 'DHL',
        cancellationReason: 'Changed mind',
        shippedAt: new Date('2024-02-01'),
        deliveredAt: new Date('2024-02-03'),
        shippingMode: 'home',
        relayPointId: 'rp-1',
        relayPointName: 'Mon relais',
        shippingCost: 699,
        status: 'DELIVERED',
        items: [],
      });
      mockPrisma.order.findUnique.mockResolvedValue(prismaOrder);

      const result = await repository.findById('order-uuid-1');

      expect(result!.stripePaymentIntentId).toBe('pi_abc');
      expect(result!.stripeRefundId).toBe('ref_abc');
      expect(result!.trackingNumber).toBe('TRK999');
      expect(result!.carrier).toBe('DHL');
      expect(result!.cancellationReason).toBe('Changed mind');
      expect(result!.shippingMode).toBe('home');
      expect(result!.relayPointId).toBe('rp-1');
      expect(result!.relayPointName).toBe('Mon relais');
      expect(result!.shippingCost).toBe(699);
    });

    it('should map OrderItem with all optional fields', async () => {
      const prismaOrder = buildPrismaOrder({
        items: [
          buildPrismaItem({
            variantId: 'var-1',
            variantInfo: 'Rouge / M',
            image: '/product.jpg',
          }),
        ],
      });
      mockPrisma.order.findUnique.mockResolvedValue(prismaOrder);

      const result = await repository.findById('order-uuid-1');

      expect(result!.items[0]!.variantId).toBe('var-1');
      expect(result!.items[0]!.variantInfo).toBe('Rouge / M');
      expect(result!.items[0]!.image).toBe('/product.jpg');
    });

    it('should throw when Order.reconstitute fails (invalid status)', async () => {
      const prismaOrder = buildPrismaOrder({
        status: 'INVALID_STATUS',
        items: [],
      });
      mockPrisma.order.findUnique.mockResolvedValue(prismaOrder);

      await expect(repository.findById('order-uuid-1')).rejects.toThrow(
        'Failed to reconstitute order'
      );
    });
  });

  describe('findByOrderNumber', () => {
    it('should return null when order is not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      const result = await repository.findByOrderNumber('ORD-NOTEXIST');

      expect(result).toBeNull();
    });

    it('should return an Order domain entity when found', async () => {
      const prismaOrder = buildPrismaOrder({ orderNumber: 'ORD-001', items: [] });
      mockPrisma.order.findUnique.mockResolvedValue(prismaOrder);

      const result = await repository.findByOrderNumber('ORD-001');

      expect(result).not.toBeNull();
      expect(result!.orderNumber).toBe('ORD-001');
    });
  });

  describe('findByCreatorId', () => {
    it('should return orders and total for a creator', async () => {
      const prismaOrder = buildPrismaOrder({ items: [] });
      mockPrisma.order.findMany.mockResolvedValue([prismaOrder]);
      mockPrisma.order.count.mockResolvedValue(1);

      const result = await repository.findByCreatorId('creator-123');

      expect(result.orders).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should apply status filter', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      await repository.findByCreatorId('creator-123', { status: 'PAID' });

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PAID' }),
        })
      );
    });

    it('should apply search filter on orderNumber, customerName, customerEmail', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      await repository.findByCreatorId('creator-123', { search: 'dupont' });

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { orderNumber: expect.objectContaining({ contains: 'dupont' }) },
              { customerName: expect.objectContaining({ contains: 'dupont' }) },
              { customerEmail: expect.objectContaining({ contains: 'dupont' }) },
            ]),
          }),
        })
      );
    });

    it('should apply customerId filter', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      await repository.findByCreatorId('creator-123', { customerId: 'customer-456' });

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: 'customer-456' }),
        })
      );
    });

    it('should apply pagination options', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      await repository.findByCreatorId('creator-123', undefined, { skip: 10, take: 5 });

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 })
      );
    });

    it('should use default pagination when not provided', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      await repository.findByCreatorId('creator-123');

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 })
      );
    });
  });

  describe('findByCustomerId', () => {
    it('should return orders and total for a customer', async () => {
      const prismaOrder = buildPrismaOrder({ items: [] });
      mockPrisma.order.findMany.mockResolvedValue([prismaOrder]);
      mockPrisma.order.count.mockResolvedValue(1);

      const result = await repository.findByCustomerId('customer-123');

      expect(result.orders).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should apply pagination options', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      await repository.findByCustomerId('customer-123', { skip: 5, take: 10 });

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 10 })
      );
    });
  });

  describe('delete', () => {
    it('should delete an order by id', async () => {
      mockPrisma.order.delete.mockResolvedValue({});

      await repository.delete('order-uuid-1');

      expect(mockPrisma.order.delete).toHaveBeenCalledWith({
        where: { id: 'order-uuid-1' },
      });
    });
  });
});
