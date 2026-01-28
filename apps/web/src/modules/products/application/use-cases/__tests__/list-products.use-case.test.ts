import { describe, it, expect, beforeEach } from 'vitest';
import { ListProductsUseCase } from '../products/list-products.use-case';
import { ProductRepository } from '../../ports/product.repository.interface';
import { Product } from '../../../domain/entities/product.entity';
import { Money } from '../../../domain/value-objects/money.vo';

// Extended mock repository for list operations
interface ProductListRepository extends ProductRepository {
  findByCreatorIdWithPagination(
    creatorId: string,
    options: {
      status?: string;
      projectId?: string;
      search?: string;
      skip: number;
      take: number;
    }
  ): Promise<{ products: Product[]; total: number }>;
}

class MockProductRepository implements ProductListRepository {
  private products: Product[] = [];

  setProducts(products: Product[]): void {
    this.products = products;
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.find((p) => p.idString === id) ?? null;
  }

  async findByCreatorId(
    creatorId: string,
    filters?: { projectId?: string; status?: string }
  ): Promise<Product[]> {
    let result = this.products.filter((p) => p.creatorId === creatorId);

    if (filters?.projectId) {
      result = result.filter((p) => p.projectId === filters.projectId);
    }

    if (filters?.status) {
      result = result.filter((p) => p.status.value === filters.status);
    }

    return result;
  }

  async findByCreatorIdWithPagination(
    creatorId: string,
    options: {
      status?: string;
      projectId?: string;
      search?: string;
      skip: number;
      take: number;
    }
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
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
      );
    }

    const total = result.length;
    const products = result.slice(options.skip, options.skip + options.take);

    return { products, total };
  }

  async save(): Promise<void> {}
  async delete(): Promise<void> {}
  async countByCreatorId(): Promise<number> {
    return 0;
  }
}

describe('ListProductsUseCase', () => {
  let useCase: ListProductsUseCase;
  let mockRepo: MockProductRepository;

  beforeEach(() => {
    mockRepo = new MockProductRepository();
    useCase = new ListProductsUseCase(mockRepo);

    // Setup test products
    const price1 = Money.create(29.99).value!;
    const price2 = Money.create(49.99).value!;
    const price3 = Money.create(19.99).value!;

    const product1 = Product.create({
      creatorId: 'creator-123',
      name: 'Produit A',
      description: 'Description du produit A',
      projectId: 'project-1',
      price: price1,
    }).value!;

    const product2 = Product.create({
      creatorId: 'creator-123',
      name: 'Produit B',
      description: 'Autre description',
      projectId: 'project-2',
      price: price2,
    }).value!;

    const product3 = Product.create({
      creatorId: 'creator-123',
      name: 'Produit C',
      projectId: 'project-1',
      price: price3,
    }).value!;

    // Publish product2
    product2.publish();

    mockRepo.setProducts([product1, product2, product3]);
  });

  describe('execute', () => {
    it('should return all products for creator', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.products).toHaveLength(3);
      expect(result.value!.total).toBe(3);
    });

    it('should filter by status DRAFT', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        status: 'DRAFT',
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.products).toHaveLength(2);
      expect(result.value!.products.every((p) => p.status === 'DRAFT')).toBe(true);
    });

    it('should filter by status PUBLISHED', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        status: 'PUBLISHED',
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.products).toHaveLength(1);
      expect(result.value!.products[0]?.status).toBe('PUBLISHED');
    });

    it('should filter by projectId', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        projectId: 'project-1',
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.products).toHaveLength(2);
      expect(result.value!.products.every((p) => p.projectId === 'project-1')).toBe(true);
    });

    it('should search by name', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        search: 'Produit A',
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.products).toHaveLength(1);
      expect(result.value!.products[0]?.name).toBe('Produit A');
    });

    it('should search by description', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        search: 'Autre description',
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.products).toHaveLength(1);
      expect(result.value!.products[0]?.name).toBe('Produit B');
    });

    it('should paginate results', async () => {
      // Act - first page
      const result1 = await useCase.execute({
        creatorId: 'creator-123',
        page: 1,
        limit: 2,
      });

      // Assert
      expect(result1.isSuccess).toBe(true);
      expect(result1.value!.products).toHaveLength(2);
      expect(result1.value!.total).toBe(3);
      expect(result1.value!.pages).toBe(2);

      // Act - second page
      const result2 = await useCase.execute({
        creatorId: 'creator-123',
        page: 2,
        limit: 2,
      });

      // Assert
      expect(result2.isSuccess).toBe(true);
      expect(result2.value!.products).toHaveLength(1);
    });

    it('should fail when creatorId is empty', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: '',
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should return empty list when no products found', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: 'other-creator',
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.products).toHaveLength(0);
      expect(result.value!.total).toBe(0);
    });

    it('should combine filters', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        status: 'DRAFT',
        projectId: 'project-1',
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.products).toHaveLength(2);
    });
  });
});
