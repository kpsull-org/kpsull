import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { RemoveFromWishlistUseCase } from '../remove-from-wishlist.use-case';
import type { WishlistRepository } from '../../ports/wishlist.repository.interface';
import { WishlistItem } from '../../../domain/entities/wishlist-item.entity';

describe('RemoveFromWishlist Use Case', () => {
  let useCase: RemoveFromWishlistUseCase;
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
      delete: vi.fn().mockResolvedValue(undefined),
      deleteByUserAndProduct: vi.fn().mockResolvedValue(undefined),
      countByUserId: vi.fn(),
    };

    useCase = new RemoveFromWishlistUseCase(mockRepository as unknown as WishlistRepository);
  });

  describe('execute', () => {
    it('should remove a product from wishlist successfully', async () => {
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
      expect(mockRepository.findByUserAndProduct).toHaveBeenCalledWith('user-123', 'product-456');
      expect(mockRepository.deleteByUserAndProduct).toHaveBeenCalledWith('user-123', 'product-456');
    });

    it('should fail when product is not in wishlist', async () => {
      mockRepository.findByUserAndProduct.mockResolvedValue(null);

      const result = await useCase.execute({
        userId: 'user-123',
        productId: 'product-456',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('pas dans la wishlist');
      expect(mockRepository.deleteByUserAndProduct).not.toHaveBeenCalled();
    });

    it('should fail when userId is missing', async () => {
      const result = await useCase.execute({
        userId: '',
        productId: 'product-456',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('User ID');
      expect(mockRepository.deleteByUserAndProduct).not.toHaveBeenCalled();
    });

    it('should fail when productId is missing', async () => {
      const result = await useCase.execute({
        userId: 'user-123',
        productId: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Product ID');
      expect(mockRepository.deleteByUserAndProduct).not.toHaveBeenCalled();
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
  });
});
