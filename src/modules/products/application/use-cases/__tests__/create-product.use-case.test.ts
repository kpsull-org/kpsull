import { describe, it, expect, beforeEach } from 'vitest';
import { CreateProductUseCase } from '../products/create-product.use-case';
import { TestProductRepository } from '../../../__tests__/helpers/test-product.repository';

describe('CreateProductUseCase', () => {
  let useCase: CreateProductUseCase;
  let mockRepo: TestProductRepository;

  beforeEach(() => {
    mockRepo = new TestProductRepository();
    useCase = new CreateProductUseCase(mockRepo);
  });

  describe('execute', () => {
    it('should create a product successfully', async () => {
      const result = await useCase.execute({
        creatorId: 'creator-123',
        name: 'Mon Produit',
        description: 'Description du produit',
        price: 29.99,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.name).toBe('Mon Produit');
      expect(result.value.description).toBe('Description du produit');
      expect(result.value.price).toBe(29.99);
      expect(result.value.status).toBe('DRAFT');
      expect(mockRepo.savedProduct).not.toBeNull();
    });

    it('should create a product with project', async () => {
      const result = await useCase.execute({
        creatorId: 'creator-123',
        name: 'Mon Produit',
        price: 29.99,
        projectId: 'project-123',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.projectId).toBe('project-123');
    });

    it('should fail when name is empty', async () => {
      const result = await useCase.execute({
        creatorId: 'creator-123',
        name: '',
        price: 29.99,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom');
    });

    it('should fail when price is zero', async () => {
      const result = await useCase.execute({
        creatorId: 'creator-123',
        name: 'Mon Produit',
        price: 0,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('supérieur à 0');
    });

    it('should fail when price is negative', async () => {
      const result = await useCase.execute({
        creatorId: 'creator-123',
        name: 'Mon Produit',
        price: -10,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('négatif');
    });

    it('should fail when creatorId is empty', async () => {
      const result = await useCase.execute({
        creatorId: '',
        name: 'Mon Produit',
        price: 29.99,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should create product in DRAFT status (not increment subscription)', async () => {
      const result = await useCase.execute({
        creatorId: 'creator-123',
        name: 'Mon Produit',
        price: 29.99,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('DRAFT');
    });

    it('should return product with id', async () => {
      const result = await useCase.execute({
        creatorId: 'creator-123',
        name: 'Mon Produit',
        price: 29.99,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBeDefined();
      expect(result.value.id.length).toBeGreaterThan(0);
    });
  });
});
