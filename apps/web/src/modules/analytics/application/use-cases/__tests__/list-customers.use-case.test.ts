import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { ListCustomersUseCase } from '../list-customers.use-case';
import type { CustomerRepository, CustomerSummary, ListCustomersResult } from '../../ports';

type MockCustomerRepository = {
  [K in keyof CustomerRepository]: Mock;
};

describe('ListCustomersUseCase', () => {
  let useCase: ListCustomersUseCase;
  let mockRepository: MockCustomerRepository;

  const createMockCustomer = (overrides: Partial<CustomerSummary> = {}): CustomerSummary => ({
    id: 'customer-1',
    name: 'Jean Dupont',
    email: 'jean.dupont@example.com',
    totalOrders: 5,
    totalSpent: 25000, // 250.00 EUR in cents
    lastOrderDate: new Date('2024-01-15'),
    ...overrides,
  });

  const createMockCustomersResult = (
    overrides: Partial<ListCustomersResult> = {}
  ): ListCustomersResult => ({
    customers: [
      createMockCustomer({ id: 'customer-1', name: 'Jean Dupont' }),
      createMockCustomer({ id: 'customer-2', name: 'Marie Martin', email: 'marie@example.com' }),
      createMockCustomer({ id: 'customer-3', name: 'Pierre Bernard', email: 'pierre@example.com' }),
    ],
    total: 3,
    ...overrides,
  });

  beforeEach(() => {
    mockRepository = {
      listCustomers: vi.fn(),
    };
    useCase = new ListCustomersUseCase(
      mockRepository as unknown as CustomerRepository
    );
  });

  describe('execute', () => {
    it('should return customers for a creator', async () => {
      // Arrange
      const mockResult = createMockCustomersResult();
      mockRepository.listCustomers.mockResolvedValue(mockResult);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.customers).toHaveLength(3);
      expect(result.value.total).toBe(3);
      expect(result.value.page).toBe(1);
      expect(result.value.pageSize).toBe(10);
      expect(result.value.totalPages).toBe(1);
    });

    it('should call repository with correct default parameters', async () => {
      // Arrange
      const mockResult = createMockCustomersResult();
      mockRepository.listCustomers.mockResolvedValue(mockResult);

      // Act
      await useCase.execute({
        creatorId: 'creator-123',
      });

      // Assert
      expect(mockRepository.listCustomers).toHaveBeenCalledWith({
        creatorId: 'creator-123',
        search: undefined,
        sortBy: 'lastOrderDate',
        sortDirection: 'desc',
        page: 1,
        pageSize: 10,
      });
    });

    it('should support sorting by totalSpent', async () => {
      // Arrange
      const mockResult = createMockCustomersResult();
      mockRepository.listCustomers.mockResolvedValue(mockResult);

      // Act
      await useCase.execute({
        creatorId: 'creator-123',
        sortBy: 'totalSpent',
        sortDirection: 'desc',
      });

      // Assert
      expect(mockRepository.listCustomers).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'totalSpent',
          sortDirection: 'desc',
        })
      );
    });

    it('should support sorting by totalOrders', async () => {
      // Arrange
      const mockResult = createMockCustomersResult();
      mockRepository.listCustomers.mockResolvedValue(mockResult);

      // Act
      await useCase.execute({
        creatorId: 'creator-123',
        sortBy: 'totalOrders',
        sortDirection: 'asc',
      });

      // Assert
      expect(mockRepository.listCustomers).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'totalOrders',
          sortDirection: 'asc',
        })
      );
    });

    it('should support sorting by name', async () => {
      // Arrange
      const mockResult = createMockCustomersResult();
      mockRepository.listCustomers.mockResolvedValue(mockResult);

      // Act
      await useCase.execute({
        creatorId: 'creator-123',
        sortBy: 'name',
        sortDirection: 'asc',
      });

      // Assert
      expect(mockRepository.listCustomers).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'name',
          sortDirection: 'asc',
        })
      );
    });

    it('should support search by name or email', async () => {
      // Arrange
      const mockResult = createMockCustomersResult({
        customers: [createMockCustomer({ name: 'Jean Dupont' })],
        total: 1,
      });
      mockRepository.listCustomers.mockResolvedValue(mockResult);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        search: 'jean',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockRepository.listCustomers).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'jean',
        })
      );
      expect(result.value.customers).toHaveLength(1);
    });

    it('should trim and ignore empty search query', async () => {
      // Arrange
      const mockResult = createMockCustomersResult();
      mockRepository.listCustomers.mockResolvedValue(mockResult);

      // Act
      await useCase.execute({
        creatorId: 'creator-123',
        search: '   ',
      });

      // Assert
      expect(mockRepository.listCustomers).toHaveBeenCalledWith(
        expect.objectContaining({
          search: undefined,
        })
      );
    });

    it('should support pagination', async () => {
      // Arrange
      const mockResult = createMockCustomersResult({
        total: 25,
      });
      mockRepository.listCustomers.mockResolvedValue(mockResult);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        page: 2,
        pageSize: 10,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockRepository.listCustomers).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          pageSize: 10,
        })
      );
      expect(result.value.page).toBe(2);
      expect(result.value.totalPages).toBe(3);
    });

    it('should calculate totalPages correctly', async () => {
      // Arrange
      const mockResult = createMockCustomersResult({
        total: 23,
      });
      mockRepository.listCustomers.mockResolvedValue(mockResult);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        pageSize: 10,
      });

      // Assert
      expect(result.value.totalPages).toBe(3);
    });

    it('should enforce maximum page size of 100', async () => {
      // Arrange
      const mockResult = createMockCustomersResult();
      mockRepository.listCustomers.mockResolvedValue(mockResult);

      // Act
      await useCase.execute({
        creatorId: 'creator-123',
        pageSize: 500,
      });

      // Assert
      expect(mockRepository.listCustomers).toHaveBeenCalledWith(
        expect.objectContaining({
          pageSize: 100,
        })
      );
    });

    it('should enforce minimum page of 1', async () => {
      // Arrange
      const mockResult = createMockCustomersResult();
      mockRepository.listCustomers.mockResolvedValue(mockResult);

      // Act
      await useCase.execute({
        creatorId: 'creator-123',
        page: -1,
      });

      // Assert
      expect(mockRepository.listCustomers).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
        })
      );
    });

    it('should fail when creatorId is empty', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: '',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should fail when creatorId is whitespace', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: '   ',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockRepository.listCustomers.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('clients');
      expect(result.error).toContain('Database connection failed');
    });

    it('should return empty list when no customers found', async () => {
      // Arrange
      const emptyResult = createMockCustomersResult({
        customers: [],
        total: 0,
      });
      mockRepository.listCustomers.mockResolvedValue(emptyResult);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.customers).toHaveLength(0);
      expect(result.value.total).toBe(0);
      expect(result.value.totalPages).toBe(0);
    });

    it('should return customer data with correct structure', async () => {
      // Arrange
      const mockResult = createMockCustomersResult({
        customers: [
          createMockCustomer({
            id: 'cust-1',
            name: 'Test User',
            email: 'test@example.com',
            totalOrders: 10,
            totalSpent: 50000,
            lastOrderDate: new Date('2024-02-01'),
          }),
        ],
        total: 1,
      });
      mockRepository.listCustomers.mockResolvedValue(mockResult);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const customer = result.value.customers[0];
      expect(customer).toBeDefined();
      if (customer) {
        expect(customer.id).toBe('cust-1');
        expect(customer.name).toBe('Test User');
        expect(customer.email).toBe('test@example.com');
        expect(customer.totalOrders).toBe(10);
        expect(customer.totalSpent).toBe(50000);
        expect(customer.lastOrderDate).toEqual(new Date('2024-02-01'));
      }
    });
  });
});
