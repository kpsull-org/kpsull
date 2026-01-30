import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application';
import { WishlistItem } from '../../domain/entities/wishlist-item.entity';
import type { WishlistRepository } from '../ports/wishlist.repository.interface';

export interface AddToWishlistInput {
  userId: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string;
  creatorId: string;
  creatorName: string;
}

export interface AddToWishlistOutput {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string;
  creatorId: string;
  creatorName: string;
  addedAt: Date;
}

export class AddToWishlistUseCase implements UseCase<AddToWishlistInput, AddToWishlistOutput> {
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  async execute(input: AddToWishlistInput): Promise<Result<AddToWishlistOutput>> {
    // Create the wishlist item (validates input)
    const itemResult = WishlistItem.create({
      userId: input.userId,
      productId: input.productId,
      productName: input.productName,
      productPrice: input.productPrice,
      productImage: input.productImage,
      creatorId: input.creatorId,
      creatorName: input.creatorName,
    });

    if (itemResult.isFailure) {
      return Result.fail(itemResult.error!);
    }

    const item = itemResult.value;

    // Check if already in wishlist
    const existingItem = await this.wishlistRepository.findByUserAndProduct(
      input.userId,
      input.productId
    );

    if (existingItem) {
      return Result.fail('Ce produit est deja dans votre wishlist');
    }

    // Save to repository
    await this.wishlistRepository.save(item);

    return Result.ok({
      id: item.idString,
      userId: item.userId,
      productId: item.productId,
      productName: item.productName,
      productPrice: item.productPrice,
      productImage: item.productImage,
      creatorId: item.creatorId,
      creatorName: item.creatorName,
      addedAt: item.addedAt,
    });
  }
}
