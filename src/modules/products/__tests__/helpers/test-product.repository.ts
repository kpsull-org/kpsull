import type { ProductRepository } from '../../application/ports/product.repository.interface';
import type { Product } from '../../domain/entities/product.entity';
import type { ProductVariant } from '../../domain/entities/product-variant.entity';

export class TestProductRepository implements ProductRepository {
  public savedProduct: Product | null = null;
  private products: Map<string, Product> = new Map();

  set(product: Product): void {
    this.products.set(product.idString, product);
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.get(id) ?? null;
  }

  async findByCreatorId(): Promise<Product[]> {
    return [...this.products.values()];
  }

  async save(product: Product): Promise<void> {
    this.savedProduct = product;
    this.products.set(product.idString, product);
  }

  async delete(id: string): Promise<void> {
    this.products.delete(id);
  }

  async countByCreatorId(): Promise<number> {
    return this.products.size;
  }

  async findVariantsByProductId(): Promise<ProductVariant[]> {
    return [];
  }

  async saveVariant(): Promise<void> {}

  async deleteVariant(): Promise<void> {}
}
