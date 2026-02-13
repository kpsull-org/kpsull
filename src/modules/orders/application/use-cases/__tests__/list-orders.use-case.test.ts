import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { ListOrdersUseCase } from '../list-orders.use-case';
import { OrderRepository } from '../../ports/order.repository.interface';
import { Order } from '../../../domain/entities/order.entity';
import { OrderItem } from '../../../domain/entities/order-item.entity';

type MockOrderRepository = {
  [K in keyof OrderRepository]: Mock;
};

describe('ListOrdersUseCase', () => {
  let useCase: ListOrdersUseCase;
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
    useCase = new ListOrdersUseCase(mockRepository as unknown as OrderRepository);
  });

  const createMockOrder = (overrides: Partial<{ creatorId: string; customerId: string }> = {}) => {
    const items = [
      OrderItem.create({
        productId: 'product-1',
        productName: 'Produit Test',
        price: 2999,
        quantity: 1,
      }).value,
    ];

    return Order.create({
      creatorId: overrides.creatorId || 'creator-123',
      customerId: overrides.customerId || 'customer-123',
      customerName: 'Jean Dupont',
      customerEmail: 'jean@example.com',
      items,
      shippingAddress: {
        street: '123 Rue Test',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
      },
    }).value;
  };

  describe('execute', () => {
    it('should list orders for a creator with pagination', async () => {
      // Arrange
      const orders = [createMockOrder(), createMockOrder()];
      mockRepository.findByCreatorId.mockResolvedValue({ orders, total: 10 });

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.orders).toHaveLength(2);
      expect(result.value.total).toBe(10);
      expect(result.value.pages).toBe(1);
    });

    it('should filter orders by status', async () => {
      // Arrange
      mockRepository.findByCreatorId.mockResolvedValue({ orders: [], total: 0 });

      // Act
      await useCase.execute({
        creatorId: 'creator-123',
        status: 'PAID',
        page: 1,
        limit: 10,
      });

      // Assert
      expect(mockRepository.findByCreatorId).toHaveBeenCalledWith(
        'creator-123',
        { status: 'PAID', search: undefined, customerId: undefined },
        { skip: 0, take: 10 }
      );
    });

    it('should search orders', async () => {
      // Arrange
      mockRepository.findByCreatorId.mockResolvedValue({ orders: [], total: 0 });

      // Act
      await useCase.execute({
        creatorId: 'creator-123',
        search: 'ORD-123',
        page: 1,
        limit: 10,
      });

      // Assert
      expect(mockRepository.findByCreatorId).toHaveBeenCalledWith(
        'creator-123',
        { status: undefined, search: 'ORD-123', customerId: undefined },
        { skip: 0, take: 10 }
      );
    });

    it('should calculate correct pagination offset', async () => {
      // Arrange
      mockRepository.findByCreatorId.mockResolvedValue({ orders: [], total: 0 });

      // Act
      await useCase.execute({
        creatorId: 'creator-123',
        page: 3,
        limit: 10,
      });

      // Assert
      expect(mockRepository.findByCreatorId).toHaveBeenCalledWith(
        'creator-123',
        { status: undefined, search: undefined, customerId: undefined },
        { skip: 20, take: 10 }
      );
    });

    it('should calculate total pages correctly', async () => {
      // Arrange
      mockRepository.findByCreatorId.mockResolvedValue({ orders: [], total: 25 });

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.value.pages).toBe(3);
    });

    it('should fail without creatorId', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: '',
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should map orders to DTOs', async () => {
      // Arrange
      const order = createMockOrder();
      mockRepository.findByCreatorId.mockResolvedValue({ orders: [order], total: 1 });

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        page: 1,
        limit: 10,
      });

      // Assert
      const dto = result.value.orders[0]!;
      expect(dto.id).toBe(order.idString);
      expect(dto.orderNumber).toBe(order.orderNumber);
      expect(dto.customerName).toBe('Jean Dupont');
      expect(dto.status).toBe('PENDING');
      expect(dto.totalAmount).toBe(2999);
      expect(dto.itemCount).toBe(1);
    });
  });
});
