import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { GetOrderDetailUseCase } from '../get-order-detail.use-case';
import { OrderRepository } from '../../ports/order.repository.interface';
import { Order } from '../../../domain/entities/order.entity';
import { OrderItem } from '../../../domain/entities/order-item.entity';

type MockOrderRepository = {
  [K in keyof OrderRepository]: Mock;
};

describe('GetOrderDetailUseCase', () => {
  let useCase: GetOrderDetailUseCase;
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
    useCase = new GetOrderDetailUseCase(mockRepository as unknown as OrderRepository);
  });

  const createMockOrder = () => {
    const items = [
      OrderItem.create({
        productId: 'product-1',
        productName: 'Produit A',
        price: 2999,
        quantity: 2,
        variantInfo: 'Taille M',
      }).value!,
      OrderItem.create({
        productId: 'product-2',
        productName: 'Produit B',
        price: 1999,
        quantity: 1,
      }).value!,
    ];

    return Order.create({
      creatorId: 'creator-123',
      customerId: 'customer-123',
      customerName: 'Jean Dupont',
      customerEmail: 'jean@example.com',
      items,
      shippingAddress: {
        street: '123 Rue Test',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
      },
    }).value!;
  };

  describe('execute', () => {
    it('should return order detail by id', async () => {
      // Arrange
      const order = createMockOrder();
      mockRepository.findById.mockResolvedValue(order);

      // Act
      const result = await useCase.execute({
        orderId: order.idString,
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.id).toBe(order.idString);
      expect(result.value!.orderNumber).toBe(order.orderNumber);
    });

    it('should return order items with details', async () => {
      // Arrange
      const order = createMockOrder();
      mockRepository.findById.mockResolvedValue(order);

      // Act
      const result = await useCase.execute({
        orderId: order.idString,
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.value!.items).toHaveLength(2);
      expect(result.value!.items[0]!.productName).toBe('Produit A');
      expect(result.value!.items[0]!.price).toBe(2999);
      expect(result.value!.items[0]!.quantity).toBe(2);
      expect(result.value!.items[0]!.subtotal).toBe(5998);
    });

    it('should return shipping address', async () => {
      // Arrange
      const order = createMockOrder();
      mockRepository.findById.mockResolvedValue(order);

      // Act
      const result = await useCase.execute({
        orderId: order.idString,
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.value!.shippingAddress.city).toBe('Paris');
      expect(result.value!.shippingAddress.postalCode).toBe('75001');
    });

    it('should fail if order not found', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act
      const result = await useCase.execute({
        orderId: 'non-existent',
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvée');
    });

    it('should fail if order belongs to different creator', async () => {
      // Arrange
      const order = createMockOrder();
      mockRepository.findById.mockResolvedValue(order);

      // Act
      const result = await useCase.execute({
        orderId: order.idString,
        creatorId: 'different-creator',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('autorisé');
    });

    it('should fail without orderId', async () => {
      // Act
      const result = await useCase.execute({
        orderId: '',
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isFailure).toBe(true);
    });
  });
});
