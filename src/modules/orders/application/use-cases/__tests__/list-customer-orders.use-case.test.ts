import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { ListCustomerOrdersUseCase } from '../list-customer-orders.use-case';
import { OrderRepository } from '../../ports/order.repository.interface';
import { Order } from '../../../domain/entities/order.entity';
import { OrderItem } from '../../../domain/entities/order-item.entity';

type MockOrderRepository = {
  [K in keyof OrderRepository]: Mock;
};

describe('ListCustomerOrdersUseCase', () => {
  let useCase: ListCustomerOrdersUseCase;
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
    useCase = new ListCustomerOrdersUseCase(mockRepository as unknown as OrderRepository);
  });

  const createMockOrder = (customerId = 'customer-1') => {
    const items = [
      OrderItem.create({
        productId: 'product-1',
        productName: 'Produit Test',
        price: 2999,
        quantity: 2,
      }).value!,
    ];

    return Order.create({
      creatorId: 'creator-123',
      customerId,
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

  it('should list orders for a customer with pagination', async () => {
    const orders = [createMockOrder(), createMockOrder()];
    mockRepository.findByCustomerId.mockResolvedValue({ orders, total: 10 });

    const result = await useCase.execute({
      customerId: 'customer-1',
      page: 1,
      limit: 10,
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value!.orders).toHaveLength(2);
    expect(result.value!.total).toBe(10);
    expect(result.value!.pages).toBe(1);
  });

  it('should calculate correct pagination offset', async () => {
    mockRepository.findByCustomerId.mockResolvedValue({ orders: [], total: 0 });

    await useCase.execute({
      customerId: 'customer-1',
      page: 3,
      limit: 10,
    });

    expect(mockRepository.findByCustomerId).toHaveBeenCalledWith(
      'customer-1',
      { skip: 20, take: 10 }
    );
  });

  it('should calculate total pages correctly', async () => {
    mockRepository.findByCustomerId.mockResolvedValue({ orders: [], total: 25 });

    const result = await useCase.execute({
      customerId: 'customer-1',
      page: 1,
      limit: 10,
    });

    expect(result.value!.pages).toBe(3);
  });

  it('should map orders to customer order items', async () => {
    const order = createMockOrder();
    mockRepository.findByCustomerId.mockResolvedValue({ orders: [order], total: 1 });

    const result = await useCase.execute({
      customerId: 'customer-1',
      page: 1,
      limit: 10,
    });

    const item = result.value!.orders[0]!;
    expect(item.id).toBe(order.idString);
    expect(item.orderNumber).toBe(order.orderNumber);
    expect(item.status).toBe('PENDING');
    expect(item.totalAmount).toBe(order.totalAmount);
    expect(item.itemCount).toBe(1);
    expect(item.creatorId).toBe('creator-123');
    expect(item.createdAt).toBeInstanceOf(Date);
  });

  it('should fail without customerId', async () => {
    const result = await useCase.execute({
      customerId: '',
      page: 1,
      limit: 10,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('Customer ID');
  });

  it('should fail with page < 1', async () => {
    const result = await useCase.execute({
      customerId: 'customer-1',
      page: 0,
      limit: 10,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('page');
  });

  it('should fail with limit < 1', async () => {
    const result = await useCase.execute({
      customerId: 'customer-1',
      page: 1,
      limit: 0,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('limite');
  });

  it('should fail with limit > 100', async () => {
    const result = await useCase.execute({
      customerId: 'customer-1',
      page: 1,
      limit: 101,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('limite');
  });
});
