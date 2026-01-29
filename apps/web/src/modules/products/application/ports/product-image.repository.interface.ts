import { ProductImage } from '../../domain/entities/product-image.entity';

/**
 * Interface for ProductImage Repository
 *
 * Defines the contract for persisting and retrieving product images.
 */
export interface ProductImageRepository {
  /**
   * Find an image by its ID
   */
  findById(id: string): Promise<ProductImage | null>;

  /**
   * Find all images for a product, ordered by position
   */
  findByProductId(productId: string): Promise<ProductImage[]>;

  /**
   * Save a product image (create or update)
   */
  save(image: ProductImage): Promise<void>;

  /**
   * Save multiple images at once (for batch operations like reordering)
   */
  saveMany(images: ProductImage[]): Promise<void>;

  /**
   * Delete an image by its ID
   */
  delete(id: string): Promise<void>;

  /**
   * Count images for a product
   */
  countByProductId(productId: string): Promise<number>;
}
