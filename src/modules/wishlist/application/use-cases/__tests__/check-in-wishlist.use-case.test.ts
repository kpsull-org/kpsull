import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { CheckInWishlistUseCase } from '../check-in-wishlist.use-case';
import type { WishlistRepository } from '../../ports/wishlist.repository.interface';
import { WishlistItem } from '../../../domain/entities/wishlist-item.entity';

describe('CheckInWishlist Use Case', () => {
  let useCase: CheckInWishlistUseCase;
  let mockRepository: {
    save: Mock;
    findById: Mock;
    findByUserAndProduct: Mock;
    findByUserId: Mock;
    delete: Mock;
    deleteByUserAndProduct: Mock;
    countByUserId: Mock;
  };

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

    useCase = new CheckInWishlistUseCase(mockRepository as unknown as WishlistRepository);
  });

  describe('execute', () => {
    it('should return true when product is in wishlist', async () => {
      const existingItem = WishlistItem.create({
        userId: 'user-123',
        productId: 'product-456',
        productName: 'Produit Test',
        productPrice: 2999,
        creatorId: 'creator-789',
        creatorName: 'Createur Test',
      }).value;

      mockRepository.findByUserAndProduct.mockResolvedValue(existingItem);

      const result = await useCase.execute({
        userId: 'user-123',
        productId: 'product-456',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.isInWishlist).toBe(true);
      expect(result.value.wishlistItemId).toBe(existingItem.idString);
      expect(mockRepository.findByUserAndProduct).toHaveBeenCalledWith('user-123', 'product-456');
    });

    it('should return false when product is not in wishlist', async () => {
      mockRepository.findByUserAndProduct.mockResolvedValue(null);

      const result = await useCase.execute({
        userId: 'user-123',
        productId: 'product-456',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.isInWishlist).toBe(false);
      expect(result.value.wishlistItemId).toBeUndefined();
    });

    it('should fail when userId is missing', async () => {
      const result = await useCase.execute({
        userId: '',
        productId: 'product-456',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('User ID');
    });

    it('should fail when productId is missing', async () => {
      const result = await useCase.execute({
        userId: 'user-123',
        productId: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Product ID');
    });

    it('should fail when userId is only whitespace', async () => {
      const result = await useCase.execute({
        userId: '   ',
        productId: 'product-456',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('User ID');
    });

    it('should fail when productId is only whitespace', async () => {
      const result = await useCase.execute({
        userId: 'user-123',
        productId: '   ',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Product ID');
    });

    it('should check multiple products efficiently', async () => {
      mockRepository.findByUserAndProduct
        .mockResolvedValueOnce(
          WishlistItem.create({
            userId: 'user-123',
            productId: 'product-1',
            productName: 'Produit 1',
            productPrice: 1000,
            creatorId: 'creator-1',
            creatorName: 'Creator 1',
          }).value
        )
        .mockResolvedValueOnce(null);

      const result1 = await useCase.execute({
        userId: 'user-123',
        productId: 'product-1',
      });

      const result2 = await useCase.execute({
        userId: 'user-123',
        productId: 'product-2',
      });

      expect(result1.isSuccess).toBe(true);
      expect(result1.value.isInWishlist).toBe(true);

      expect(result2.isSuccess).toBe(true);
      expect(result2.value.isInWishlist).toBe(false);
    });
  });
});
