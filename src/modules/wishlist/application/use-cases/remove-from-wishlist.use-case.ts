import { Result } from '@/shared/domain';
import type { UseCaseWithoutOutput } from '@/shared/application';
import type { WishlistRepository } from '../ports/wishlist.repository.interface';

export interface RemoveFromWishlistInput {
  userId: string;
  productId: string;
}

export class RemoveFromWishlistUseCase implements UseCaseWithoutOutput<RemoveFromWishlistInput> {
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  async execute(input: RemoveFromWishlistInput): Promise<Result<void>> {
    // Validate input
    if (!input.userId?.trim()) {
      return Result.fail('User ID est requis');
    }

    if (!input.productId?.trim()) {
      return Result.fail('Product ID est requis');
    }

    // Check if item exists in wishlist
    const existingItem = await this.wishlistRepository.findByUserAndProduct(
      input.userId.trim(),
      input.productId.trim()
    );

    if (!existingItem) {
      return Result.fail("Ce produit n'est pas dans la wishlist");
    }

    // Delete the item
    await this.wishlistRepository.deleteByUserAndProduct(
      input.userId.trim(),
      input.productId.trim()
    );

    return Result.ok();
  }
}
