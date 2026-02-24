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
      // Arrange
      const order = createPaidOrder();
      mockRepository.findById.mockResolvedValue(order);

      // Act
      const result = await useCase.execute({
        orderId: order.idString,
        creatorId: 'creator-123',
        trackingNumber: 'TRACK123456',
        carrier: 'Colissimo',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('SHIPPED');
      expect(result.value.trackingNumber).toBe('TRACK123456');
      expect(result.value.carrier).toBe('Colissimo');
    });

    it('should persist the updated order', async () => {
      // Arrange
      const order = createPaidOrder();
      mockRepository.findById.mockResolvedValue(order);

      // Act
      await useCase.execute({
        orderId: order.idString,
        creatorId: 'creator-123',
        trackingNumber: 'TRACK123456',
        carrier: 'Colissimo',
      });

      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith(order);
    });

    it('should fail if order not found', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act
      const result = await useCase.execute({
        orderId: 'non-existent',
        creatorId: 'creator-123',
        trackingNumber: 'TRACK123456',
        carrier: 'Colissimo',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvée');
    });

    it('should fail if not the order owner', async () => {
      // Arrange
      const order = createPaidOrder();
      mockRepository.findById.mockResolvedValue(order);

      // Act
      const result = await useCase.execute({
        orderId: order.idString,
        creatorId: 'different-creator',
        trackingNumber: 'TRACK123456',
        carrier: 'Colissimo',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('autorisé');
    });

    it('should fail without tracking number', async () => {
      // Arrange
      const order = createPaidOrder();
      mockRepository.findById.mockResolvedValue(order);

      // Act
      const result = await useCase.execute({
        orderId: order.idString,
        creatorId: 'creator-123',
        trackingNumber: '',
        carrier: 'Colissimo',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('suivi');
    });

    it('should fail without carrier', async () => {
      // Arrange
      const order = createPaidOrder();
      mockRepository.findById.mockResolvedValue(order);

      // Act
      const result = await useCase.execute({
        orderId: order.idString,
        creatorId: 'creator-123',
        trackingNumber: 'TRACK123456',
        carrier: '',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('transporteur');
    });

    it('should fail if order not in shippable status', async () => {
      // Arrange (pending order, not paid)
      const order = createPendingOrder();
      mockRepository.findById.mockResolvedValue(order);

      // Act
      const result = await useCase.execute({
        orderId: order.idString,
        creatorId: 'creator-123',
        trackingNumber: 'TRACK123456',
        carrier: 'Colissimo',
      });

      // Assert
      expect(result.isFailure).toBe(true);
    });
  });
});
