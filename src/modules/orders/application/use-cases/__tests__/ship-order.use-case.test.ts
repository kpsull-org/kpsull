import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { ShipOrderUseCase } from '../ship-order.use-case';
import { OrderRepository } from '../../ports/order.repository.interface';
import { createPendingOrder, createPaidOrder } from './order.fixtures';

type MockOrderRepository = {
  [K in keyof OrderRepository]: Mock;
};

describe('ShipOrderUseCase', () => {
  let useCase: ShipOrderUseCase;
  let mockRepository: MockOrderRepository;

  const defaultShipInput = {
    creatorId: 'creator-123',
    trackingNumber: 'TRACK123456',
    carrier: 'Colissimo',
  };

  beforeEach(() => {
    mockRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByOrderNumber: vi.fn(),
      findByCreatorId: vi.fn(),
      findByCustomerId: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new ShipOrderUseCase(mockRepository as unknown as OrderRepository);
  });

  describe('execute', () => {
    it('should ship a paid order', async () => {
      const order = createPaidOrder();
      mockRepository.findById.mockResolvedValue(order);

      const result = await useCase.execute({ orderId: order.idString, ...defaultShipInput });

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('SHIPPED');
      expect(result.value.trackingNumber).toBe('TRACK123456');
      expect(result.value.carrier).toBe('Colissimo');
    });

    it('should persist the updated order', async () => {
      const order = createPaidOrder();
      mockRepository.findById.mockResolvedValue(order);

      await useCase.execute({ orderId: order.idString, ...defaultShipInput });

      expect(mockRepository.save).toHaveBeenCalledWith(order);
    });

    it('should fail without orderId', async () => {
      const result = await useCase.execute({ orderId: '', ...defaultShipInput });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Order ID');
    });

    it('should fail if order not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute({ orderId: 'non-existent', ...defaultShipInput });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvée');
    });

    it('should fail if not the order owner', async () => {
      const order = createPaidOrder();
      mockRepository.findById.mockResolvedValue(order);

      const result = await useCase.execute({
        orderId: order.idString,
        creatorId: 'different-creator',
        trackingNumber: 'TRACK123456',
        carrier: 'Colissimo',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('autorisé');
    });

    it('should fail if order not in shippable status', async () => {
      const order = createPendingOrder();
      mockRepository.findById.mockResolvedValue(order);

      const result = await useCase.execute({ orderId: order.idString, ...defaultShipInput });

      expect(result.isFailure).toBe(true);
    });

    describe('missing required fields', () => {
      it.each([
        { field: 'trackingNumber', overrides: { trackingNumber: '' }, expectedError: 'suivi' },
        { field: 'carrier', overrides: { carrier: '' }, expectedError: 'transporteur' },
      ])('should fail without $field', async ({ overrides, expectedError }) => {
        const order = createPaidOrder();
        mockRepository.findById.mockResolvedValue(order);

        const result = await useCase.execute({
          orderId: order.idString,
          ...defaultShipInput,
          ...overrides,
        });

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain(expectedError);
      });
    });
  });
});
