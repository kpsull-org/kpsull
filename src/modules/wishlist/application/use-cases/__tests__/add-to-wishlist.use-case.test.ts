import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { AddToWishlistUseCase } from '../add-to-wishlist.use-case';
import type { WishlistRepository } from '../../ports/wishlist.repository.interface';
import { WishlistItem } from '../../../domain/entities/wishlist-item.entity';

describe('AddToWishlist Use Case', () => {
  let useCase: AddToWishlistUseCase;
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
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findByUserAndProduct: vi.fn(),
      findByUserId: vi.fn(),
      delete: vi.fn(),
      deleteByUserAndProduct: vi.fn(),
      countByUserId: vi.fn(),
    };

    useCase = new AddToWishlistUseCase(mockRepository as unknown as WishlistRepository);
  });

  describe('execute', () => {
    const validInput = {
      userId: 'user-123',
      productId: 'product-456',
      productName: 'Produit Test',
      productPrice: 2999,
      productImage: 'https://example.com/image.jpg',
      creatorId: 'creator-789',
      creatorName: 'Createur Test',
    };

    it('should add a product to wishlist successfully', async () => {
      mockRepository.findByUserAndProduct.mockResolvedValue(null);

      const result = await useCase.execute(validInput);

      expect(result.isSuccess).toBe(true);
      expect(result.value.userId).toBe('user-123');
      expect(result.value.productId).toBe('product-456');
      expect(result.value.productName).toBe('Produit Test');
      expect(result.value.productPrice).toBe(2999);
      expect(result.value.creatorId).toBe('creator-789');
      expect(mockRepository.findByUserAndProduct).toHaveBeenCalledWith('user-123', 'product-456');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should fail when product is already in wishlist', async () => {
      const existingItem = WishlistItem.create(validInput).value;
      mockRepository.findByUserAndProduct.mockResolvedValue(existingItem);

      const result = await useCase.execute(validInput);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('deja');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when userId is missing', async () => {
      const result = await useCase.execute({
        ...validInput,
        userId: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('User ID');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when productId is missing', async () => {
      const result = await useCase.execute({
        ...validInput,
        productId: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Product ID');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when productName is missing', async () => {
      const result = await useCase.execute({
        ...validInput,
        productName: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom du produit');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when productPrice is negative', async () => {
      const result = await useCase.execute({
        ...validInput,
        productPrice: -100,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('prix');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when creatorId is missing', async () => {
      const result = await useCase.execute({
        ...validInput,
        creatorId: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when creatorName is missing', async () => {
      const result = await useCase.execute({
        ...validInput,
        creatorName: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom du createur');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should accept products without image', async () => {
      mockRepository.findByUserAndProduct.mockResolvedValue(null);

      const result = await useCase.execute({
        ...validInput,
        productImage: undefined,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.productImage).toBeUndefined();
    });

    it('should accept free products (price = 0)', async () => {
      mockRepository.findByUserAndProduct.mockResolvedValue(null);

      const result = await useCase.execute({
        ...validInput,
        productPrice: 0,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.productPrice).toBe(0);
    });
  });
});
