import { describe, it, expect } from 'vitest';
import { ProductImage } from '../product-image.entity';
import { ImageUrl } from '../../value-objects/image-url.vo';

describe('ProductImage Entity', () => {
  const createValidImageUrl = () =>
    ImageUrl.create('https://cdn.example.com/image.jpg', 'product').value!;

  describe('create', () => {
    it('should create a ProductImage successfully', () => {
      const imageUrl = createValidImageUrl();
      const result = ProductImage.create({
        productId: 'product-123',
        url: imageUrl,
        alt: 'Product main image',
        position: 0,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value!.productId).toBe('product-123');
      expect(result.value!.url.url).toBe('https://cdn.example.com/image.jpg');
      expect(result.value!.alt).toBe('Product main image');
      expect(result.value!.position).toBe(0);
      expect(result.value!.createdAt).toBeInstanceOf(Date);
    });

    it('should create ProductImage with empty alt text', () => {
      const imageUrl = createValidImageUrl();
      const result = ProductImage.create({
        productId: 'product-123',
        url: imageUrl,
        alt: '',
        position: 1,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value!.alt).toBe('');
    });

    it('should create ProductImage with default position 0 for main image', () => {
      const imageUrl = createValidImageUrl();
      const result = ProductImage.create({
        productId: 'product-123',
        url: imageUrl,
        alt: 'Main',
        position: 0,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value!.isMainImage).toBe(true);
    });

    it('should fail when productId is empty', () => {
      const imageUrl = createValidImageUrl();
      const result = ProductImage.create({
        productId: '',
        url: imageUrl,
        alt: 'Image',
        position: 0,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Product ID');
    });

    it('should fail when position is negative', () => {
      const imageUrl = createValidImageUrl();
      const result = ProductImage.create({
        productId: 'product-123',
        url: imageUrl,
        alt: 'Image',
        position: -1,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('position');
    });
  });

  describe('isMainImage', () => {
    it('should return true when position is 0', () => {
      const imageUrl = createValidImageUrl();
      const image = ProductImage.create({
        productId: 'product-123',
        url: imageUrl,
        alt: 'Main',
        position: 0,
      }).value!;

      expect(image.isMainImage).toBe(true);
    });

    it('should return false when position is greater than 0', () => {
      const imageUrl = createValidImageUrl();
      const image = ProductImage.create({
        productId: 'product-123',
        url: imageUrl,
        alt: 'Secondary',
        position: 1,
      }).value!;

      expect(image.isMainImage).toBe(false);
    });
  });

  describe('updatePosition', () => {
    it('should update position successfully', () => {
      const imageUrl = createValidImageUrl();
      const image = ProductImage.create({
        productId: 'product-123',
        url: imageUrl,
        alt: 'Image',
        position: 0,
      }).value!;

      const result = image.updatePosition(2);

      expect(result.isSuccess).toBe(true);
      expect(image.position).toBe(2);
    });

    it('should fail when new position is negative', () => {
      const imageUrl = createValidImageUrl();
      const image = ProductImage.create({
        productId: 'product-123',
        url: imageUrl,
        alt: 'Image',
        position: 0,
      }).value!;

      const result = image.updatePosition(-1);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('position');
    });
  });

  describe('updateAlt', () => {
    it('should update alt text successfully', () => {
      const imageUrl = createValidImageUrl();
      const image = ProductImage.create({
        productId: 'product-123',
        url: imageUrl,
        alt: 'Old description',
        position: 0,
      }).value!;

      image.updateAlt('New description');

      expect(image.alt).toBe('New description');
    });

    it('should allow empty alt text', () => {
      const imageUrl = createValidImageUrl();
      const image = ProductImage.create({
        productId: 'product-123',
        url: imageUrl,
        alt: 'Some description',
        position: 0,
      }).value!;

      image.updateAlt('');

      expect(image.alt).toBe('');
    });

    it('should trim whitespace from alt text', () => {
      const imageUrl = createValidImageUrl();
      const image = ProductImage.create({
        productId: 'product-123',
        url: imageUrl,
        alt: 'Initial',
        position: 0,
      }).value!;

      image.updateAlt('  Trimmed description  ');

      expect(image.alt).toBe('Trimmed description');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from persistence data', () => {
      const result = ProductImage.reconstitute({
        id: 'image-123',
        productId: 'product-456',
        url: 'https://cdn.example.com/stored.jpg',
        urlType: 'product',
        alt: 'Stored image',
        position: 2,
        createdAt: new Date('2024-01-01'),
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value!.idString).toBe('image-123');
      expect(result.value!.productId).toBe('product-456');
      expect(result.value!.url.url).toBe('https://cdn.example.com/stored.jpg');
      expect(result.value!.alt).toBe('Stored image');
      expect(result.value!.position).toBe(2);
      expect(result.value!.createdAt).toEqual(new Date('2024-01-01'));
    });
  });

  describe('equality', () => {
    it('should be equal when IDs match', () => {
      const imageUrl = createValidImageUrl();
      const image1 = ProductImage.create({
        productId: 'product-123',
        url: imageUrl,
        alt: 'Image 1',
        position: 0,
      }).value!;

      const image2 = ProductImage.reconstitute({
        id: image1.idString,
        productId: 'product-123',
        url: 'https://different.com/image.jpg',
        urlType: 'product',
        alt: 'Different alt',
        position: 5,
        createdAt: new Date(),
      }).value!;

      expect(image1.equals(image2)).toBe(true);
    });
  });
});
