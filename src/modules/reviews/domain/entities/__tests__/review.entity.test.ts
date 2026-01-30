import { describe, it, expect } from 'vitest';
import { Review } from '../review.entity';
import { Rating } from '../../value-objects/rating.vo';

describe('Review Entity', () => {
  describe('create', () => {
    it('should create a review successfully', () => {
      const result = Review.create({
        productId: 'product-123',
        customerId: 'customer-123',
        orderId: 'order-123',
        rating: Rating.create(5).value,
        title: 'Excellent produit',
        content: 'Je suis tres satisfait de cet achat.',
        verifiedPurchase: true,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.productId).toBe('product-123');
      expect(result.value.customerId).toBe('customer-123');
      expect(result.value.orderId).toBe('order-123');
      expect(result.value.rating.value).toBe(5);
      expect(result.value.title).toBe('Excellent produit');
      expect(result.value.content).toBe('Je suis tres satisfait de cet achat.');
      expect(result.value.verifiedPurchase).toBe(true);
    });

    it('should create a review with verified purchase false', () => {
      const result = Review.create({
        productId: 'product-123',
        customerId: 'customer-123',
        orderId: 'order-123',
        rating: Rating.create(3).value,
        title: 'Produit moyen',
        content: 'Correspond a la description.',
        verifiedPurchase: false,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.verifiedPurchase).toBe(false);
    });

    it('should fail when productId is missing', () => {
      const result = Review.create({
        productId: '',
        customerId: 'customer-123',
        orderId: 'order-123',
        rating: Rating.create(5).value,
        title: 'Titre',
        content: 'Contenu',
        verifiedPurchase: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Product ID');
    });

    it('should fail when customerId is missing', () => {
      const result = Review.create({
        productId: 'product-123',
        customerId: '',
        orderId: 'order-123',
        rating: Rating.create(5).value,
        title: 'Titre',
        content: 'Contenu',
        verifiedPurchase: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Customer ID');
    });

    it('should fail when orderId is missing', () => {
      const result = Review.create({
        productId: 'product-123',
        customerId: 'customer-123',
        orderId: '',
        rating: Rating.create(5).value,
        title: 'Titre',
        content: 'Contenu',
        verifiedPurchase: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Order ID');
    });

    it('should fail when title is missing', () => {
      const result = Review.create({
        productId: 'product-123',
        customerId: 'customer-123',
        orderId: 'order-123',
        rating: Rating.create(5).value,
        title: '',
        content: 'Contenu',
        verifiedPurchase: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('titre');
    });

    it('should fail when title is too long', () => {
      const result = Review.create({
        productId: 'product-123',
        customerId: 'customer-123',
        orderId: 'order-123',
        rating: Rating.create(5).value,
        title: 'A'.repeat(256),
        content: 'Contenu',
        verifiedPurchase: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('255');
    });

    it('should fail when content is missing', () => {
      const result = Review.create({
        productId: 'product-123',
        customerId: 'customer-123',
        orderId: 'order-123',
        rating: Rating.create(5).value,
        title: 'Titre',
        content: '',
        verifiedPurchase: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('contenu');
    });

    it('should fail when content is too long', () => {
      const result = Review.create({
        productId: 'product-123',
        customerId: 'customer-123',
        orderId: 'order-123',
        rating: Rating.create(5).value,
        title: 'Titre',
        content: 'A'.repeat(5001),
        verifiedPurchase: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('5000');
    });

    it('should set createdAt and updatedAt on creation', () => {
      const before = new Date();

      const result = Review.create({
        productId: 'product-123',
        customerId: 'customer-123',
        orderId: 'order-123',
        rating: Rating.create(5).value,
        title: 'Titre',
        content: 'Contenu',
        verifiedPurchase: true,
      });

      const after = new Date();

      expect(result.isSuccess).toBe(true);
      expect(result.value.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.value.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(result.value.updatedAt.getTime()).toEqual(result.value.createdAt.getTime());
    });
  });

  describe('update', () => {
    it('should update title, content and rating', () => {
      const review = createTestReview();
      const newRating = Rating.create(4).value;

      const result = review.update('Nouveau titre', 'Nouveau contenu', newRating);

      expect(result.isSuccess).toBe(true);
      expect(review.title).toBe('Nouveau titre');
      expect(review.content).toBe('Nouveau contenu');
      expect(review.rating.value).toBe(4);
    });

    it('should update updatedAt on update', () => {
      const review = createTestReview();
      const originalUpdatedAt = review.updatedAt;

      // Small delay to ensure different timestamp
      const newRating = Rating.create(4).value;
      const result = review.update('Nouveau titre', 'Nouveau contenu', newRating);

      expect(result.isSuccess).toBe(true);
      expect(review.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it('should fail when new title is empty', () => {
      const review = createTestReview();
      const newRating = Rating.create(4).value;

      const result = review.update('', 'Nouveau contenu', newRating);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('titre');
    });

    it('should fail when new title is too long', () => {
      const review = createTestReview();
      const newRating = Rating.create(4).value;

      const result = review.update('A'.repeat(256), 'Nouveau contenu', newRating);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('255');
    });

    it('should fail when new content is empty', () => {
      const review = createTestReview();
      const newRating = Rating.create(4).value;

      const result = review.update('Nouveau titre', '', newRating);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('contenu');
    });

    it('should fail when new content is too long', () => {
      const review = createTestReview();
      const newRating = Rating.create(4).value;

      const result = review.update('Nouveau titre', 'A'.repeat(5001), newRating);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('5000');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute review from persistence', () => {
      const now = new Date();

      const result = Review.reconstitute({
        id: 'review-123',
        productId: 'product-123',
        customerId: 'customer-123',
        orderId: 'order-123',
        rating: 5,
        title: 'Excellent',
        content: 'Tres bien',
        verifiedPurchase: true,
        createdAt: now,
        updatedAt: now,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.idString).toBe('review-123');
      expect(result.value.rating.value).toBe(5);
      expect(result.value.verifiedPurchase).toBe(true);
    });

    it('should fail for invalid rating', () => {
      const now = new Date();

      const result = Review.reconstitute({
        id: 'review-123',
        productId: 'product-123',
        customerId: 'customer-123',
        orderId: 'order-123',
        rating: 10,
        title: 'Excellent',
        content: 'Tres bien',
        verifiedPurchase: true,
        createdAt: now,
        updatedAt: now,
      });

      expect(result.isFailure).toBe(true);
    });
  });

  describe('getters', () => {
    it('should return all properties correctly', () => {
      const review = createTestReview();

      expect(review.productId).toBe('product-123');
      expect(review.customerId).toBe('customer-123');
      expect(review.orderId).toBe('order-123');
      expect(review.rating.value).toBe(5);
      expect(review.title).toBe('Excellent produit');
      expect(review.content).toBe('Je suis tres satisfait.');
      expect(review.verifiedPurchase).toBe(true);
      expect(review.idString).toBeDefined();
    });
  });
});

function createTestReview(): Review {
  return Review.create({
    productId: 'product-123',
    customerId: 'customer-123',
    orderId: 'order-123',
    rating: Rating.create(5).value,
    title: 'Excellent produit',
    content: 'Je suis tres satisfait.',
    verifiedPurchase: true,
  }).value;
}
