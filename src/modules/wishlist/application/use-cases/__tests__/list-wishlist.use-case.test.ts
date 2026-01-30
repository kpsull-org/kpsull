import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { ListWishlistUseCase } from '../list-wishlist.use-case';
import type { WishlistRepository } from '../../ports/wishlist.repository.interface';
import { WishlistItem } from '../../../domain/entities/wishlist-item.entity';

describe('ListWishlist Use Case', () => {
  let useCase: ListWishlistUseCase;
  let mockRepository: {
    save: Mock;
    findById: Mock;
    findByUserAndProduct: Mock;
    findByUserId: Mock;
    delete: Mock;
    deleteByUserAndProduct: Mock;
    countByUserId: Mock;
  };

  const createMockItem = (productId: string) =>
    WishlistItem.create({
      userId: 'user-123',
      productId,
      productName: `Produit ${productId}`,
      productPrice: 2999,
      creatorId: 'creator-789',
      creatorName: 'Createur Test',
    }).value;

  beforeEach(() => {
    mockRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByUserAndProduct: vi.fn(),
      findByUserId: vi.fn(),
      delete: vi.fn(),
      deleteByUserAndProduct: vi.fn(),
      countByUserId: vi.fn(),
    };

    useCase = new ListWishlistUseCase(mockRepository as unknown as WishlistRepository);
  });

  describe('execute', () => {
    it('should list wishlist items with pagination', async () => {
      const mockItems = [createMockItem('product-1'), createMockItem('product-2')];

      mockRepository.findByUserId.mockResolvedValue({
        items: mockItems,
        total: 5,
      });

      const result = await useCase.execute({
        userId: 'user-123',
        page: 1,
        limit: 2,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.items).toHaveLength(2);
      expect(result.value.total).toBe(5);
      expect(result.value.page).toBe(1);
      expect(result.value.limit).toBe(2);
      expect(result.value.totalPages).toBe(3);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123', {
        skip: 0,
        take: 2,
      });
    });

    it('should return empty list when user has no wishlist items', async () => {
      mockRepository.findByUserId.mockResolvedValue({
        items: [],
        total: 0,
      });

      const result = await useCase.execute({
        userId: 'user-123',
        page: 1,
        limit: 10,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.items).toHaveLength(0);
      expect(result.value.total).toBe(0);
      expect(result.value.totalPages).toBe(0);
    });

    it('should use default pagination when not provided', async () => {
      mockRepository.findByUserId.mockResolvedValue({
        items: [],
        total: 0,
      });

      await useCase.execute({ userId: 'user-123' });

      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123', {
        skip: 0,
        take: 10,
      });
    });

    it('should calculate correct skip for different pages', async () => {
      mockRepository.findByUserId.mockResolvedValue({
        items: [],
        total: 25,
      });

      await useCase.execute({
        userId: 'user-123',
        page: 3,
        limit: 5,
      });

      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123', {
        skip: 10, // (3 - 1) * 5
        take: 5,
      });
    });

    it('should fail when userId is missing', async () => {
      const result = await useCase.execute({
        userId: '',
        page: 1,
        limit: 10,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('User ID');
    });

    it('should fail when page is less than 1', async () => {
      const result = await useCase.execute({
        userId: 'user-123',
        page: 0,
        limit: 10,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('page');
    });

    it('should fail when limit is less than 1', async () => {
      const result = await useCase.execute({
        userId: 'user-123',
        page: 1,
        limit: 0,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('limit');
    });

    it('should fail when limit exceeds maximum (100)', async () => {
      const result = await useCase.execute({
        userId: 'user-123',
        page: 1,
        limit: 101,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('limit');
    });

    it('should calculate totalPages correctly', async () => {
      mockRepository.findByUserId.mockResolvedValue({
        items: [],
        total: 23,
      });

      const result = await useCase.execute({
        userId: 'user-123',
        page: 1,
        limit: 10,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.totalPages).toBe(3); // ceil(23 / 10)
    });

    it('should map wishlist items to output DTOs', async () => {
      const mockItem = createMockItem('product-1');
      mockRepository.findByUserId.mockResolvedValue({
        items: [mockItem],
        total: 1,
      });

      const result = await useCase.execute({
        userId: 'user-123',
        page: 1,
        limit: 10,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.items[0]).toMatchObject({
        id: mockItem.idString,
        userId: 'user-123',
        productId: 'product-1',
        productName: 'Produit product-1',
        productPrice: 2999,
        creatorId: 'creator-789',
        creatorName: 'Createur Test',
      });
      expect(result.value.items[0]?.addedAt).toBeInstanceOf(Date);
    });
  });
});
