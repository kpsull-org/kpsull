import { WishlistItem } from '../../domain/entities/wishlist-item.entity';

export interface PaginationOptions {
  skip: number;
  take: number;
}

export interface WishlistRepository {
  /**
   * Save a wishlist item (create)
   */
  save(item: WishlistItem): Promise<void>;

  /**
   * Find a wishlist item by its ID
   */
  findById(id: string): Promise<WishlistItem | null>;

  /**
   * Find a wishlist item by user and product
   * Used to check if a product is already in the wishlist
   */
  findByUserAndProduct(userId: string, productId: string): Promise<WishlistItem | null>;

  /**
   * Find all wishlist items for a user with pagination
   */
  findByUserId(
    userId: string,
    pagination?: PaginationOptions
  ): Promise<{ items: WishlistItem[]; total: number }>;

  /**
   * Delete a wishlist item
   */
  delete(id: string): Promise<void>;

  /**
   * Delete a wishlist item by user and product
   */
  deleteByUserAndProduct(userId: string, productId: string): Promise<void>;

  /**
   * Count total items in user's wishlist
   */
  countByUserId(userId: string): Promise<number>;
}
