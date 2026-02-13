import { describe, it, expect } from 'vitest';
import { Product } from '../product.entity';
import { Money } from '../../value-objects/money.vo';

const VALID_PROPS = {
  creatorId: 'creator-123',
  name: 'T-shirt Bio',
  price: Money.fromCents(2999, 'EUR'),
};

function createProduct(overrides = {}) {
  return Product.create({ ...VALID_PROPS, ...overrides });
}

describe('Product Entity', () => {
  describe('create', () => {
    it('should create a product with valid props', () => {
      const result = createProduct();

      expect(result.isSuccess).toBe(true);
      expect(result.value.creatorId).toBe('creator-123');
      expect(result.value.name).toBe('T-shirt Bio');
      expect(result.value.isDraft).toBe(true);
      expect(result.value.isPublished).toBe(false);
      expect(result.value.isArchived).toBe(false);
      expect(result.value.idString).toBeDefined();
    });

    it('should create with optional description and projectId', () => {
      const result = createProduct({
        description: 'Un super t-shirt',
        projectId: 'project-1',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.description).toBe('Un super t-shirt');
      expect(result.value.projectId).toBe('project-1');
    });

    it('should return undefined for optional fields', () => {
      const result = createProduct();

      expect(result.value.description).toBeUndefined();
      expect(result.value.projectId).toBeUndefined();
      expect(result.value.publishedAt).toBeUndefined();
    });

    it('should fail when creatorId is empty', () => {
      const result = createProduct({ creatorId: '' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should fail when name is empty', () => {
      const result = createProduct({ name: '' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom du produit');
    });

    it('should fail when name exceeds 200 characters', () => {
      const result = createProduct({ name: 'A'.repeat(201) });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('200 caractères');
    });
  });

  describe('publish', () => {
    it('should publish a draft product', () => {
      const product = createProduct().value;

      const result = product.publish();

      expect(result.isSuccess).toBe(true);
      expect(product.isPublished).toBe(true);
      expect(product.publishedAt).toBeDefined();
    });

    it('should fail if already published', () => {
      const product = createProduct().value;
      product.publish();

      const result = product.publish();

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('déjà publié');
    });
  });

  describe('unpublish', () => {
    it('should unpublish a published product', () => {
      const product = createProduct().value;
      product.publish();

      const result = product.unpublish();

      expect(result.isSuccess).toBe(true);
      expect(product.isDraft).toBe(true);
    });

    it('should fail if already draft', () => {
      const product = createProduct().value;

      const result = product.unpublish();

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('déjà en brouillon');
    });
  });

  describe('archive', () => {
    it('should archive a draft product', () => {
      const product = createProduct().value;

      const result = product.archive();

      expect(result.isSuccess).toBe(true);
      expect(product.isArchived).toBe(true);
    });

    it('should archive a published product', () => {
      const product = createProduct().value;
      product.publish();

      const result = product.archive();

      expect(result.isSuccess).toBe(true);
      expect(product.isArchived).toBe(true);
    });

    it('should fail if already archived', () => {
      const product = createProduct().value;
      product.archive();

      const result = product.archive();

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('déjà archivé');
    });
  });

  describe('updateName', () => {
    it('should update name', () => {
      const product = createProduct().value;

      const result = product.updateName('Nouveau nom');

      expect(result.isSuccess).toBe(true);
      expect(product.name).toBe('Nouveau nom');
    });

    it('should trim name', () => {
      const product = createProduct().value;

      product.updateName('  Nom avec espaces  ');

      expect(product.name).toBe('Nom avec espaces');
    });

    it('should fail when name is empty', () => {
      const product = createProduct().value;

      const result = product.updateName('');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom du produit');
    });

    it('should fail when name exceeds 200 characters', () => {
      const product = createProduct().value;

      const result = product.updateName('A'.repeat(201));

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('200 caractères');
    });
  });

  describe('updateDescription', () => {
    it('should update description', () => {
      const product = createProduct().value;

      product.updateDescription('Nouvelle description');

      expect(product.description).toBe('Nouvelle description');
    });
  });

  describe('updatePrice', () => {
    it('should update price', () => {
      const product = createProduct().value;
      const newPrice = Money.fromCents(5999, 'EUR');

      product.updatePrice(newPrice);

      expect(product.price.equals(newPrice)).toBe(true);
    });
  });

  describe('assignToProject', () => {
    it('should assign to project', () => {
      const product = createProduct().value;

      product.assignToProject('project-42');

      expect(product.projectId).toBe('project-42');
    });

    it('should unassign from project', () => {
      const product = createProduct({ projectId: 'project-1' }).value;

      product.assignToProject(undefined);

      expect(product.projectId).toBeUndefined();
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from persistence data', () => {
      const now = new Date();
      const result = Product.reconstitute({
        id: 'prod-42',
        creatorId: 'creator-1',
        projectId: 'project-1',
        name: 'Hoodie',
        description: 'Un hoodie',
        priceAmount: 5999,
        priceCurrency: 'EUR',
        status: 'PUBLISHED',
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.idString).toBe('prod-42');
      expect(result.value.isPublished).toBe(true);
      expect(result.value.name).toBe('Hoodie');
    });

    it('should fail with invalid status', () => {
      const now = new Date();
      const result = Product.reconstitute({
        id: 'prod-42',
        creatorId: 'creator-1',
        name: 'Test',
        priceAmount: 100,
        priceCurrency: 'EUR',
        status: 'INVALID' as any,
        createdAt: now,
        updatedAt: now,
      });

      expect(result.isFailure).toBe(true);
    });
  });

  describe('getters', () => {
    it('should return timestamps', () => {
      const product = createProduct().value;

      expect(product.createdAt).toBeInstanceOf(Date);
      expect(product.updatedAt).toBeInstanceOf(Date);
    });

    it('should return price', () => {
      const product = createProduct().value;

      expect(product.price).toBeDefined();
    });

    it('should return status', () => {
      const product = createProduct().value;

      expect(product.status).toBeDefined();
      expect(product.status.isDraft).toBe(true);
    });
  });
});
