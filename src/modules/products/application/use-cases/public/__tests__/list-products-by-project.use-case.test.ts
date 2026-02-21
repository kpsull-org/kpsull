import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
  ListProductsByProjectUseCase,
  type ListProductsByProjectInput,
  type ProjectProductsRepository,
} from '../list-products-by-project.use-case';
import { Product } from '../../../../domain/entities/product.entity';
import { Project } from '../../../../domain/entities/project.entity';
import { Money } from '../../../../domain/value-objects/money.vo';

describe('ListProductsByProjectUseCase', () => {
  let useCase: ListProductsByProjectUseCase;
  let mockRepo: {
    findPublishedProjectById: Mock;
    findPublishedProductsByProjectIdWithPagination: Mock;
    findFirstVariantImagesByProductIds: Mock;
  };

  const createMockProject = (id: string, name: string) => {
    const project = Project.create({
      creatorId: 'creator-123',
      name,
      description: `Description de ${name}`,
    }).value;

    // Mock the idString
    Object.defineProperty(project, 'idString', { value: id });

    return project;
  };

  const createMockProduct = (id: string, name: string, priceAmount: number, projectId: string) => {
    const price = Money.create(priceAmount).value;
    const product = Product.create({
      creatorId: 'creator-123',
      projectId,
      name,
      description: `Description de ${name}`,
      price,
    }).value;

    // Force the product to be published
    product.publish();

    // Mock the idString
    Object.defineProperty(product, 'idString', { value: id });

    return product;
  };

  beforeEach(() => {
    mockRepo = {
      findPublishedProjectById: vi.fn(),
      findPublishedProductsByProjectIdWithPagination: vi.fn(),
      findFirstVariantImagesByProductIds: vi.fn().mockResolvedValue([]),
    };
    useCase = new ListProductsByProjectUseCase(mockRepo as unknown as ProjectProductsRepository);
  });

  describe('execute', () => {
    it('should return products of a published project', async () => {
      // Arrange
      const project = createMockProject('project-1', 'Ma Collection');
      const product1 = createMockProduct('prod-1', 'Produit A', 29.99, 'project-1');
      const product2 = createMockProduct('prod-2', 'Produit B', 49.99, 'project-1');

      mockRepo.findPublishedProjectById.mockResolvedValue(project);
      mockRepo.findPublishedProductsByProjectIdWithPagination.mockResolvedValue({
        products: [product1, product2],
        total: 2,
      });
      mockRepo.findFirstVariantImagesByProductIds.mockResolvedValue([
        { productId: 'prod-1', url: 'https://example.com/image.jpg' },
      ]);

      const input: ListProductsByProjectInput = {
        projectId: 'project-1',
        page: 1,
        limit: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.project.id).toBe('project-1');
      expect(result.value.project.name).toBe('Ma Collection');
      expect(result.value.products).toHaveLength(2);
      expect(result.value.total).toBe(2);
    });

    it('should not expose creatorId in project or products', async () => {
      // Arrange
      const project = createMockProject('project-1', 'Ma Collection');
      const product = createMockProduct('prod-1', 'Produit A', 29.99, 'project-1');

      mockRepo.findPublishedProjectById.mockResolvedValue(project);
      mockRepo.findPublishedProductsByProjectIdWithPagination.mockResolvedValue({
        products: [product],
        total: 1,
      });

      const input: ListProductsByProjectInput = {
        projectId: 'project-1',
        page: 1,
        limit: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect('creatorId' in result.value.project).toBe(false);
      expect('creatorId' in result.value.products[0]!).toBe(false);
    });

    it('should fail when project not found', async () => {
      // Arrange
      mockRepo.findPublishedProjectById.mockResolvedValue(null);

      const input: ListProductsByProjectInput = {
        projectId: 'non-existent',
        page: 1,
        limit: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Projet non trouve');
    });

    it('should fail when projectId is empty', async () => {
      // Arrange
      const input: ListProductsByProjectInput = {
        projectId: '',
        page: 1,
        limit: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Project ID est requis');
    });

    it('should include main image URL for products', async () => {
      // Arrange
      const project = createMockProject('project-1', 'Ma Collection');
      const product1 = createMockProduct('prod-1', 'Produit A', 29.99, 'project-1');
      const product2 = createMockProduct('prod-2', 'Produit B', 49.99, 'project-1');

      mockRepo.findPublishedProjectById.mockResolvedValue(project);
      mockRepo.findPublishedProductsByProjectIdWithPagination.mockResolvedValue({
        products: [product1, product2],
        total: 2,
      });
      mockRepo.findFirstVariantImagesByProductIds.mockResolvedValue([
        { productId: 'prod-1', url: 'https://example.com/image.jpg' },
      ]);

      const input: ListProductsByProjectInput = {
        projectId: 'project-1',
        page: 1,
        limit: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.products[0]!.mainImageUrl).toBe('https://example.com/image.jpg');
      expect(result.value.products[1]!.mainImageUrl).toBeUndefined();
    });

    it('should handle empty product list', async () => {
      // Arrange
      const project = createMockProject('project-1', 'Ma Collection');

      mockRepo.findPublishedProjectById.mockResolvedValue(project);
      mockRepo.findPublishedProductsByProjectIdWithPagination.mockResolvedValue({
        products: [],
        total: 0,
      });

      const input: ListProductsByProjectInput = {
        projectId: 'project-1',
        page: 1,
        limit: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.products).toHaveLength(0);
      expect(result.value.total).toBe(0);
      expect(result.value.pages).toBe(0);
    });
  });
});
