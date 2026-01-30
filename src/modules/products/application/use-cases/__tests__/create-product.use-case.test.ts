import { describe, it, expect, beforeEach } from 'vitest';
import { CreateProductUseCase } from '../products/create-product.use-case';
import { ProductRepository } from '../../ports/product.repository.interface';
import { Product } from '../../../domain/entities/product.entity';

// Mock repository
class MockProductRepository implements ProductRepository {
  public savedProduct: Product | null = null;
  private products: Map<string, Product> = new Map();

  async findById(id: string): Promise<Product | null> {
    return this.products.get(id) ?? null;
  }

  async findByCreatorId(): Promise<Product[]> {
    return [];
  }

  async save(product: Product): Promise<void> {
    this.savedProduct = product;
    this.products.set(product.idString, product);
  }

  async delete(): Promise<void> {}

  async countByCreatorId(): Promise<number> {
    return 0;
  }

  async findVariantsByProductId(): Promise<never[]> {
    return [];
  }

  async saveVariant(): Promise<void> {}

  async deleteVariant(): Promise<void> {}
}

describe('CreateProductUseCase', () => {
  let useCase: CreateProductUseCase;
  let mockRepo: MockProductRepository;

  beforeEach(() => {
    mockRepo = new MockProductRepository();
    useCase = new CreateProductUseCase(mockRepo);
  });

  describe('execute', () => {
    it('should create a product successfully', async () => {
      // Arrange
      const input = {
        creatorId: 'creator-123',
        name: 'Mon Produit',
        description: 'Description du produit',
        price: 29.99,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.name).toBe('Mon Produit');
      expect(result.value!.description).toBe('Description du produit');
      expect(result.value!.price).toBe(29.99);
      expect(result.value!.status).toBe('DRAFT');
      expect(mockRepo.savedProduct).not.toBeNull();
    });

    it('should create a product with project', async () => {
      // Arrange
      const input = {
        creatorId: 'creator-123',
        name: 'Mon Produit',
        price: 29.99,
        projectId: 'project-123',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.projectId).toBe('project-123');
    });

    it('should fail when name is empty', async () => {
      // Arrange
      const input = {
        creatorId: 'creator-123',
        name: '',
        price: 29.99,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom');
    });

    it('should fail when price is zero', async () => {
      // Arrange
      const input = {
        creatorId: 'creator-123',
        name: 'Mon Produit',
        price: 0,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('supérieur à 0');
    });

    it('should fail when price is negative', async () => {
      // Arrange
      const input = {
        creatorId: 'creator-123',
        name: 'Mon Produit',
        price: -10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('négatif');
    });

    it('should fail when creatorId is empty', async () => {
      // Arrange
      const input = {
        creatorId: '',
        name: 'Mon Produit',
        price: 29.99,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should create product in DRAFT status (not increment subscription)', async () => {
      // Arrange
      const input = {
        creatorId: 'creator-123',
        name: 'Mon Produit',
        price: 29.99,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe('DRAFT');
      // Product count should not be incremented for DRAFT products
    });

    it('should return product with id', async () => {
      // Arrange
      const input = {
        creatorId: 'creator-123',
        name: 'Mon Produit',
        price: 29.99,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.id).toBeDefined();
      expect(result.value!.id.length).toBeGreaterThan(0);
    });
  });
});
