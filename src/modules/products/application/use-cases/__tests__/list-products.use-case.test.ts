import { describe, it, expect, beforeEach } from 'vitest';
import { ListProductsUseCase, type ProductListRepository } from '../products/list-products.use-case';
import { Product } from '../../../domain/entities/product.entity';
import { Money } from '../../../domain/value-objects/money.vo';

class TestProductListRepository implements ProductListRepository {
  private products: Product[] = [];

  set(products: Product[]): void {
    this.products = products;
  }

  async findByCreatorIdWithPagination(
    creatorId: string,
    options: { status?: string; projectId?: string; search?: string; skip: number; take: number }
  ): Promise<{ products: Product[]; total: number }> {
    let result = this.products.filter((p) => p.creatorId === creatorId);

    if (options.status) {
      result = result.filter((p) => p.status.value === options.status);
    }
    if (options.projectId) {
      result = result.filter((p) => p.projectId === options.projectId);
    }
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(searchLower) || p.description?.toLowerCase().includes(searchLower)
      );
    }

    const total = result.length;
    const products = result.slice(options.skip, options.skip + options.take);
    return { products, total };
  }
}

function createProduct(overrides: { name: string; price: number; projectId?: string; description?: string }): Product {
  return Product.create({
    creatorId: 'creator-123',
    name: overrides.name,
    description: overrides.description,
    projectId: overrides.projectId,
    price: Money.create(overrides.price).value,
  }).value;
}

describe('ListProductsUseCase', () => {
  let useCase: ListProductsUseCase;
  let mockRepo: TestProductListRepository;

  beforeEach(() => {
    mockRepo = new TestProductListRepository();
    useCase = new ListProductsUseCase(mockRepo);

    const product1 = createProduct({ name: 'Produit A', description: 'Description du produit A', projectId: 'project-1', price: 29.99 });
    const product2 = createProduct({ name: 'Produit B', description: 'Autre description', projectId: 'project-2', price: 49.99 });
    const product3 = createProduct({ name: 'Produit C', projectId: 'project-1', price: 19.99 });

    product2.publish();
    mockRepo.set([product1, product2, product3]);
  });

  describe('execute', () => {
    it('should return all products for creator', async () => {
      const result = await useCase.execute({ creatorId: 'creator-123', page: 1, limit: 10 });

      expect(result.isSuccess).toBe(true);
      expect(result.value.products).toHaveLength(3);
      expect(result.value.total).toBe(3);
    });

    it('should filter by status DRAFT', async () => {
      const result = await useCase.execute({ creatorId: 'creator-123', status: 'DRAFT', page: 1, limit: 10 });

      expect(result.isSuccess).toBe(true);
      expect(result.value.products).toHaveLength(2);
      expect(result.value.products.every((p) => p.status === 'DRAFT')).toBe(true);
    });

    it('should filter by status PUBLISHED', async () => {
      const result = await useCase.execute({ creatorId: 'creator-123', status: 'PUBLISHED', page: 1, limit: 10 });

      expect(result.isSuccess).toBe(true);
      expect(result.value.products).toHaveLength(1);
      expect(result.value.products[0]?.status).toBe('PUBLISHED');
    });

    it('should filter by projectId', async () => {
      const result = await useCase.execute({ creatorId: 'creator-123', projectId: 'project-1', page: 1, limit: 10 });

      expect(result.isSuccess).toBe(true);
      expect(result.value.products).toHaveLength(2);
      expect(result.value.products.every((p) => p.projectId === 'project-1')).toBe(true);
    });

    it('should search by name', async () => {
      const result = await useCase.execute({ creatorId: 'creator-123', search: 'Produit A', page: 1, limit: 10 });

      expect(result.isSuccess).toBe(true);
      expect(result.value.products).toHaveLength(1);
      expect(result.value.products[0]?.name).toBe('Produit A');
    });

    it('should search by description', async () => {
      const result = await useCase.execute({ creatorId: 'creator-123', search: 'Autre description', page: 1, limit: 10 });

      expect(result.isSuccess).toBe(true);
      expect(result.value.products).toHaveLength(1);
      expect(result.value.products[0]?.name).toBe('Produit B');
    });

    it('should paginate results', async () => {
      const result1 = await useCase.execute({ creatorId: 'creator-123', page: 1, limit: 2 });

      expect(result1.isSuccess).toBe(true);
      expect(result1.value.products).toHaveLength(2);
      expect(result1.value.total).toBe(3);
      expect(result1.value.pages).toBe(2);

      const result2 = await useCase.execute({ creatorId: 'creator-123', page: 2, limit: 2 });

      expect(result2.isSuccess).toBe(true);
      expect(result2.value.products).toHaveLength(1);
    });

    it('should fail when creatorId is empty', async () => {
      const result = await useCase.execute({ creatorId: '', page: 1, limit: 10 });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should return empty list when no products found', async () => {
      const result = await useCase.execute({ creatorId: 'other-creator', page: 1, limit: 10 });

      expect(result.isSuccess).toBe(true);
      expect(result.value.products).toHaveLength(0);
      expect(result.value.total).toBe(0);
    });

    it('should combine filters', async () => {
      const result = await useCase.execute({ creatorId: 'creator-123', status: 'DRAFT', projectId: 'project-1', page: 1, limit: 10 });

      expect(result.isSuccess).toBe(true);
      expect(result.value.products).toHaveLength(2);
    });
  });
});
