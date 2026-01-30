import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application';
import type { WishlistRepository } from '../ports/wishlist.repository.interface';

export interface ListWishlistInput {
  userId: string;
  page?: number;
  limit?: number;
}

export interface WishlistItemOutput {
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

export interface ListWishlistOutput {
  items: WishlistItemOutput[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export class ListWishlistUseCase implements UseCase<ListWishlistInput, ListWishlistOutput> {
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  async execute(input: ListWishlistInput): Promise<Result<ListWishlistOutput>> {
    // Validate input
    if (!input.userId?.trim()) {
      return Result.fail('User ID est requis');
    }

    const page = input.page ?? DEFAULT_PAGE;
    const limit = input.limit ?? DEFAULT_LIMIT;

    if (page < 1) {
      return Result.fail('La page doit etre >= 1');
    }

    if (limit < 1) {
      return Result.fail('La limit doit etre >= 1');
    }

    if (limit > MAX_LIMIT) {
      return Result.fail(`La limit ne peut pas depasser ${MAX_LIMIT}`);
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch from repository
    const { items, total } = await this.wishlistRepository.findByUserId(input.userId.trim(), {
      skip,
      take: limit,
    });

    // Calculate total pages
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

    // Map to output DTOs
    const mappedItems: WishlistItemOutput[] = items.map((item) => ({
      id: item.idString,
      userId: item.userId,
      productId: item.productId,
      productName: item.productName,
      productPrice: item.productPrice,
      productImage: item.productImage,
      creatorId: item.creatorId,
      creatorName: item.creatorName,
      addedAt: item.addedAt,
    }));

    return Result.ok({
      items: mappedItems,
      total,
      page,
      limit,
      totalPages,
    });
  }
}
