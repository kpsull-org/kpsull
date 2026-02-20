import { ProductVariant } from '../../domain/entities/product-variant.entity';

export interface VariantRepository {
  findById(id: string): Promise<ProductVariant | null>;
  findByProductId(productId: string): Promise<ProductVariant[]>;
  save(variant: ProductVariant): Promise<void>;
  delete(id: string): Promise<void>;
  countByProductId(productId: string): Promise<number>;
}
