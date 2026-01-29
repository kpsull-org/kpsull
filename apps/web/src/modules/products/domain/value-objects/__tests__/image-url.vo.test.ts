import { describe, it, expect } from 'vitest';
import { ImageUrl } from '../image-url.vo';

describe('ImageUrl Value Object', () => {
  describe('create', () => {
    describe('valid URLs', () => {
      it('should create ImageUrl with https URL', () => {
        const result = ImageUrl.create('https://example.com/image.jpg', 'product');

        expect(result.isSuccess).toBe(true);
        expect(result.value!.url).toBe('https://example.com/image.jpg');
        expect(result.value!.type).toBe('product');
      });

      it('should create ImageUrl with relative URL starting with /uploads/', () => {
        const result = ImageUrl.create('/uploads/products/123/image.jpg', 'product');

        expect(result.isSuccess).toBe(true);
        expect(result.value!.url).toBe('/uploads/products/123/image.jpg');
      });

      it('should create ImageUrl for variant type', () => {
        const result = ImageUrl.create('https://cdn.example.com/variant.png', 'variant');

        expect(result.isSuccess).toBe(true);
        expect(result.value!.type).toBe('variant');
      });

      it('should create ImageUrl for project type', () => {
        const result = ImageUrl.create('/uploads/projects/cover.webp', 'project');

        expect(result.isSuccess).toBe(true);
        expect(result.value!.type).toBe('project');
      });
    });

    describe('invalid URLs', () => {
      it('should fail when URL is empty', () => {
        const result = ImageUrl.create('', 'product');

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('URL');
      });

      it('should fail when URL is only whitespace', () => {
        const result = ImageUrl.create('   ', 'product');

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('URL');
      });

      it('should fail when URL does not start with https://', () => {
        const result = ImageUrl.create('http://example.com/image.jpg', 'product');

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('https://');
      });

      it('should fail when relative URL does not start with /uploads/', () => {
        const result = ImageUrl.create('/images/photo.jpg', 'product');

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('/uploads/');
      });

      it('should fail when URL is just a random string', () => {
        const result = ImageUrl.create('not-a-valid-url', 'product');

        expect(result.isFailure).toBe(true);
      });
    });
  });

  describe('isExternal', () => {
    it('should return true for https URLs', () => {
      const result = ImageUrl.create('https://cdn.example.com/image.jpg', 'product');

      expect(result.value!.isExternal).toBe(true);
    });

    it('should return false for relative URLs', () => {
      const result = ImageUrl.create('/uploads/products/image.jpg', 'product');

      expect(result.value!.isExternal).toBe(false);
    });
  });

  describe('isLocal', () => {
    it('should return false for https URLs', () => {
      const result = ImageUrl.create('https://cdn.example.com/image.jpg', 'product');

      expect(result.value!.isLocal).toBe(false);
    });

    it('should return true for relative URLs', () => {
      const result = ImageUrl.create('/uploads/products/image.jpg', 'product');

      expect(result.value!.isLocal).toBe(true);
    });
  });

  describe('equality', () => {
    it('should be equal when url and type match', () => {
      const url1 = ImageUrl.create('https://example.com/img.jpg', 'product').value!;
      const url2 = ImageUrl.create('https://example.com/img.jpg', 'product').value!;

      expect(url1.equals(url2)).toBe(true);
    });

    it('should not be equal when url differs', () => {
      const url1 = ImageUrl.create('https://example.com/img1.jpg', 'product').value!;
      const url2 = ImageUrl.create('https://example.com/img2.jpg', 'product').value!;

      expect(url1.equals(url2)).toBe(false);
    });

    it('should not be equal when type differs', () => {
      const url1 = ImageUrl.create('https://example.com/img.jpg', 'product').value!;
      const url2 = ImageUrl.create('https://example.com/img.jpg', 'variant').value!;

      expect(url1.equals(url2)).toBe(false);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from raw values', () => {
      const imageUrl = ImageUrl.reconstitute('https://example.com/img.jpg', 'product');

      expect(imageUrl.url).toBe('https://example.com/img.jpg');
      expect(imageUrl.type).toBe('product');
    });
  });
});
