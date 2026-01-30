import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application';
import type { WishlistRepository } from '../ports/wishlist.repository.interface';

export interface CheckInWishlistInput {
  userId: string;
  productId: string;
}

export interface CheckInWishlistOutput {
  isInWishlist: boolean;
  wishlistItemId?: string;
}

export class CheckInWishlistUseCase implements UseCase<CheckInWishlistInput, CheckInWishlistOutput> {
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  async execute(input: CheckInWishlistInput): Promise<Result<CheckInWishlistOutput>> {
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

    if (existingItem) {
      return Result.ok({
        isInWishlist: true,
        wishlistItemId: existingItem.idString,
      });
    }

    return Result.ok({
      isInWishlist: false,
      wishlistItemId: undefined,
    });
  }
}
