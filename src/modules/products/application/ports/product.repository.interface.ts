import { Product } from '../../domain/entities/product.entity';
import { ProductVariant } from '../../domain/entities/product-variant.entity';
import { ProductStatusValue } from '../../domain/value-objects/product-status.vo';

export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findByCreatorId(
    creatorId: string,
    filters?: {
      projectId?: string;
      status?: ProductStatusValue;
    }
  ): Promise<Product[]>;
  save(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
  countByCreatorId(creatorId: string, status?: ProductStatusValue): Promise<number>;

  // Variant methods
  findVariantsByProductId(productId: string): Promise<ProductVariant[]>;
  saveVariant(variant: ProductVariant): Promise<void>;
  deleteVariant(id: string): Promise<void>;
}
