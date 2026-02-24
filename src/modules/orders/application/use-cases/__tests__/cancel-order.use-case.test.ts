import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';

vi.mock('@/modules/products/application/services/stock.service', () => ({
  incrementStock: vi.fn().mockResolvedValue(undefined),
  decrementStock: vi.fn().mockResolvedValue(undefined),
}));

import { CancelOrderUseCase } from '../cancel-order.use-case';
import { OrderRepository } from '../../ports/order.repository.interface';
import { createPendingOrder, createPaidOrder, createShippedOrder } from './order.fixtures';

type MockOrderRepository = {
  [K in keyof OrderRepository]: Mock;
};

describe('CancelOrderUseCase', () => {
  let useCase: CancelOrderUseCase;
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
    useCase = new CancelOrderUseCase(mockRepository as unknown as OrderRepository);
  });

  describe('execute', () => {
    it('should cancel a pending order', async () => {
      // Arrange
      const order = createPendingOrder();
      mockRepository.findById.mockResolvedValue(order);

      // Act
      const result = await useCase.execute({
        orderId: order.idString,
        creatorId: 'creator-123',
        reason: 'Client a demande annulation',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('CANCELED');
      expect(result.value.cancellationReason).toBe('Client a demande annulation');
    });

    it('should cancel a paid order', async () => {
      // Arrange
      const order = createPaidOrder();
      mockRepository.findById.mockResolvedValue(order);

      // Act
      const result = await useCase.execute({
        orderId: order.idString,
        creatorId: 'creator-123',
        reason: 'Produit indisponible',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('CANCELED');
    });

    it('should persist the cancelled order', async () => {
      // Arrange
      const order = createPendingOrder();
      mockRepository.findById.mockResolvedValue(order);

      // Act
      await useCase.execute({
        orderId: order.idString,
        creatorId: 'creator-123',
        reason: 'Client a demande annulation',
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
        reason: 'Raison annulation',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvee');
    });

    it('should fail if not the order owner', async () => {
      // Arrange
      const order = createPendingOrder();
      mockRepository.findById.mockResolvedValue(order);

      // Act
      const result = await useCase.execute({
        orderId: order.idString,
        creatorId: 'different-creator',
        reason: 'Raison annulation',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('autorise');
    });

    it('should fail without reason', async () => {
      // Arrange
      const order = createPendingOrder();
      mockRepository.findById.mockResolvedValue(order);

      // Act
      const result = await useCase.execute({
        orderId: order.idString,
        creatorId: 'creator-123',
        reason: '',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('raison');
    });

    it('should fail without orderId', async () => {
      // Act
      const result = await useCase.execute({
        orderId: '',
        creatorId: 'creator-123',
        reason: 'Raison annulation',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Order ID');
    });

    it('should fail if order is already shipped', async () => {
      // Arrange
      const order = createShippedOrder();
      mockRepository.findById.mockResolvedValue(order);

      // Act
      const result = await useCase.execute({
        orderId: order.idString,
        creatorId: 'creator-123',
        reason: 'Raison annulation',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('expédiée');
    });

    it('should trim the reason', async () => {
      // Arrange
      const order = createPendingOrder();
      mockRepository.findById.mockResolvedValue(order);

      // Act
      const result = await useCase.execute({
        orderId: order.idString,
        creatorId: 'creator-123',
        reason: '  Raison avec espaces  ',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.cancellationReason).toBe('Raison avec espaces');
    });
  });
});
