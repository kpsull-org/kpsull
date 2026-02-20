import { ProductSku } from '../../domain/entities/product-sku.entity';

export interface SkuRepository {
  findById(id: string): Promise<ProductSku | null>;
  findByProductId(productId: string): Promise<ProductSku[]>;
  findByVariantId(variantId: string): Promise<ProductSku[]>;
  upsert(sku: ProductSku): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByProductId(productId: string): Promise<void>;
}
