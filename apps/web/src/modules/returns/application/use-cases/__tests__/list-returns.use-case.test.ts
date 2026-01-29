import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { ListReturnsUseCase } from '../list-returns.use-case';
import type { ReturnRepository, ReturnRequest } from '../../ports/return.repository.interface';

type MockReturnRepository = {
  [K in keyof ReturnRepository]: Mock;
};

describe('ListReturnsUseCase', () => {
  let useCase: ListReturnsUseCase;
  let mockRepository: MockReturnRepository;

  beforeEach(() => {
    mockRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByOrderId: vi.fn(),
      findByCreatorId: vi.fn(),
      findByCustomerId: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new ListReturnsUseCase(mockRepository as unknown as ReturnRepository);
  });

  const createReturnRequests = (): ReturnRequest[] => [
    {
      id: 'return-1',
      orderId: 'order-1',
      orderNumber: 'KPS-2024-001',
      creatorId: 'creator-123',
      customerId: 'customer-1',
      customerName: 'Jean Dupont',
      customerEmail: 'jean@example.com',
      reason: 'DEFECTIVE',
      reasonDetails: 'Produit defectueux',
      status: 'REQUESTED',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'return-2',
      orderId: 'order-2',
      orderNumber: 'KPS-2024-002',
      creatorId: 'creator-123',
      customerId: 'customer-2',
      customerName: 'Marie Martin',
      customerEmail: 'marie@example.com',
      reason: 'CHANGED_MIND',
      status: 'APPROVED',
      createdAt: new Date(),
      updatedAt: new Date(),
      approvedAt: new Date(),
    },
  ];

  describe('execute', () => {
    it('should list returns for a creator', async () => {
      // Arrange
      const returns = createReturnRequests();
      mockRepository.findByCreatorId.mockResolvedValue({
        returns,
        total: 2,
      });

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.returns).toHaveLength(2);
      expect(result.value!.total).toBe(2);
      expect(result.value!.page).toBe(1);
    });

    it('should filter by status', async () => {
      // Arrange
      mockRepository.findByCreatorId.mockResolvedValue({
        returns: [createReturnRequests()[0]],
        total: 1,
      });

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        status: 'REQUESTED',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockRepository.findByCreatorId).toHaveBeenCalledWith(
        'creator-123',
        { status: 'REQUESTED' },
        expect.any(Object)
      );
    });

    it('should handle pagination', async () => {
      // Arrange
      mockRepository.findByCreatorId.mockResolvedValue({
        returns: [],
        total: 25,
      });

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        page: 2,
        limit: 10,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockRepository.findByCreatorId).toHaveBeenCalledWith(
        'creator-123',
        {},
        { skip: 10, take: 10 }
      );
      expect(result.value!.page).toBe(2);
      expect(result.value!.totalPages).toBe(3);
    });

    it('should calculate total pages correctly', async () => {
      // Arrange
      mockRepository.findByCreatorId.mockResolvedValue({
        returns: [],
        total: 15,
      });

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        limit: 10,
      });

      // Assert
      expect(result.value!.totalPages).toBe(2);
    });

    it('should fail without creatorId', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: '',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should default to page 1 and limit 10', async () => {
      // Arrange
      mockRepository.findByCreatorId.mockResolvedValue({
        returns: [],
        total: 0,
      });

      // Act
      await useCase.execute({
        creatorId: 'creator-123',
      });

      // Assert
      expect(mockRepository.findByCreatorId).toHaveBeenCalledWith(
        'creator-123',
        {},
        { skip: 0, take: 10 }
      );
    });

    it('should enforce minimum page of 1', async () => {
      // Arrange
      mockRepository.findByCreatorId.mockResolvedValue({
        returns: [],
        total: 0,
      });

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        page: 0,
      });

      // Assert
      expect(result.value!.page).toBe(1);
    });

    it('should enforce maximum limit of 50', async () => {
      // Arrange
      mockRepository.findByCreatorId.mockResolvedValue({
        returns: [],
        total: 0,
      });

      // Act
      await useCase.execute({
        creatorId: 'creator-123',
        limit: 100,
      });

      // Assert
      expect(mockRepository.findByCreatorId).toHaveBeenCalledWith(
        'creator-123',
        {},
        { skip: 0, take: 50 }
      );
    });

    it('should map return data correctly', async () => {
      // Arrange
      const returns = createReturnRequests();
      mockRepository.findByCreatorId.mockResolvedValue({
        returns,
        total: 2,
      });

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
      });

      // Assert
      const firstReturn = result.value!.returns[0];
      expect(firstReturn).toMatchObject({
        id: 'return-1',
        orderId: 'order-1',
        orderNumber: 'KPS-2024-001',
        customerName: 'Jean Dupont',
        customerEmail: 'jean@example.com',
        reason: 'DEFECTIVE',
        status: 'REQUESTED',
      });
    });
  });
});
