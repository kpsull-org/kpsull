import { describe, it, expect } from 'vitest';
import { Product } from '../entities/product.entity';
import { Money } from '../value-objects/money.vo';

describe('Product Entity', () => {
  describe('create', () => {
    it('should create a valid product with required fields', () => {
      // Arrange
      const price = Money.create(29.99).value;
      const props = {
        creatorId: 'creator-123',
        name: 'Mon Produit',
        price,
      };

      // Act
      const result = Product.create(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.creatorId).toBe('creator-123');
      expect(result.value.name).toBe('Mon Produit');
      expect(result.value.price.displayAmount).toBe(29.99);
      expect(result.value.isDraft).toBe(true);
      expect(result.value.isPublished).toBe(false);
    });

    it('should create a product with optional fields', () => {
      // Arrange
      const price = Money.create(49.99).value;
      const props = {
        creatorId: 'creator-123',
        name: 'Mon Produit',
        description: 'Description du produit',
        projectId: 'project-123',
        price,
      };

      // Act
      const result = Product.create(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.description).toBe('Description du produit');
      expect(result.value.projectId).toBe('project-123');
    });

    it('should fail when name is empty', () => {
      // Arrange
      const price = Money.create(29.99).value;
      const props = {
        creatorId: 'creator-123',
        name: '',
        price,
      };

      // Act
      const result = Product.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom');
    });

    it('should fail when name is only whitespace', () => {
      // Arrange
      const price = Money.create(29.99).value;
      const props = {
        creatorId: 'creator-123',
        name: '   ',
        price,
      };

      // Act
      const result = Product.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom');
    });

    it('should fail when name exceeds 200 characters', () => {
      // Arrange
      const price = Money.create(29.99).value;
      const props = {
        creatorId: 'creator-123',
        name: 'a'.repeat(201),
        price,
      };

      // Act
      const result = Product.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('200');
    });

    it('should fail when creatorId is empty', () => {
      // Arrange
      const price = Money.create(29.99).value;
      const props = {
        creatorId: '',
        name: 'Mon Produit',
        price,
      };

      // Act
      const result = Product.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a product from persistence', () => {
      // Arrange
      const props = {
        id: 'product-123',
        creatorId: 'creator-123',
        name: 'Mon Produit',
        description: 'Description',
        projectId: 'project-123',
        priceAmount: 2999,
        priceCurrency: 'EUR',
        status: 'PUBLISHED' as const,
        publishedAt: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      // Act
      const result = Product.reconstitute(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.idString).toBe('product-123');
      expect(result.value.isPublished).toBe(true);
      expect(result.value.publishedAt).toEqual(new Date('2024-01-15'));
    });
  });

  describe('publish', () => {
    it('should publish a draft product', () => {
      // Arrange
      const price = Money.create(29.99).value;
      const product = Product.create({
        creatorId: 'creator-123',
        name: 'Mon Produit',
        price,
      }).value;

      // Act
      const result = product.publish();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(product.isPublished).toBe(true);
      expect(product.publishedAt).toBeDefined();
    });

    it('should fail to publish an already published product', () => {
      // Arrange
      const product = Product.reconstitute({
        id: 'product-123',
        creatorId: 'creator-123',
        name: 'Mon Produit',
        priceAmount: 2999,
        priceCurrency: 'EUR',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value;

      // Act
      const result = product.publish();

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('déjà publié');
    });
  });

  describe('unpublish', () => {
    it('should unpublish a published product', () => {
      // Arrange
      const product = Product.reconstitute({
        id: 'product-123',
        creatorId: 'creator-123',
        name: 'Mon Produit',
        priceAmount: 2999,
        priceCurrency: 'EUR',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value;

      // Act
      const result = product.unpublish();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(product.isDraft).toBe(true);
    });

    it('should fail to unpublish a draft product', () => {
      // Arrange
      const price = Money.create(29.99).value;
      const product = Product.create({
        creatorId: 'creator-123',
        name: 'Mon Produit',
        price,
      }).value;

      // Act
      const result = product.unpublish();

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('brouillon');
    });
  });

  describe('updateName', () => {
    it('should update the name successfully', () => {
      // Arrange
      const price = Money.create(29.99).value;
      const product = Product.create({
        creatorId: 'creator-123',
        name: 'Ancien Nom',
        price,
      }).value;

      // Act
      const result = product.updateName('Nouveau Nom');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(product.name).toBe('Nouveau Nom');
    });

    it('should fail with empty name', () => {
      // Arrange
      const price = Money.create(29.99).value;
      const product = Product.create({
        creatorId: 'creator-123',
        name: 'Mon Produit',
        price,
      }).value;

      // Act
      const result = product.updateName('');

      // Assert
      expect(result.isFailure).toBe(true);
    });
  });

  describe('updateDescription', () => {
    it('should update the description', () => {
      // Arrange
      const price = Money.create(29.99).value;
      const product = Product.create({
        creatorId: 'creator-123',
        name: 'Mon Produit',
        price,
      }).value;

      // Act
      product.updateDescription('Nouvelle description');

      // Assert
      expect(product.description).toBe('Nouvelle description');
    });
  });

  describe('updatePrice', () => {
    it('should update the price', () => {
      // Arrange
      const price = Money.create(29.99).value;
      const product = Product.create({
        creatorId: 'creator-123',
        name: 'Mon Produit',
        price,
      }).value;

      const newPrice = Money.create(39.99).value;

      // Act
      product.updatePrice(newPrice);

      // Assert
      expect(product.price.displayAmount).toBe(39.99);
    });
  });

  describe('assignToProject', () => {
    it('should assign product to a project', () => {
      // Arrange
      const price = Money.create(29.99).value;
      const product = Product.create({
        creatorId: 'creator-123',
        name: 'Mon Produit',
        price,
      }).value;

      // Act
      product.assignToProject('project-123');

      // Assert
      expect(product.projectId).toBe('project-123');
    });

    it('should remove product from project when null', () => {
      // Arrange
      const price = Money.create(29.99).value;
      const product = Product.create({
        creatorId: 'creator-123',
        name: 'Mon Produit',
        projectId: 'project-123',
        price,
      }).value;

      // Act
      product.assignToProject(undefined);

      // Assert
      expect(product.projectId).toBeUndefined();
    });
  });
});
