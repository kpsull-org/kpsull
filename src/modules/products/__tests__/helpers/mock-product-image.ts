import { vi, type Mock } from 'vitest';
import { ProductImage } from '../../domain/entities/product-image.entity';

export const createMockProductImage = (overrides: Partial<{
  id: string;
  productId: string;
  url: string;
  position: number;
}> = {}) => {
  return ProductImage.reconstitute({
    id: overrides.id ?? 'image-123',
    productId: overrides.productId ?? 'product-456',
    url: overrides.url ?? 'https://cdn.example.com/image.jpg',
    urlType: 'product',
    alt: 'Test image',
    position: overrides.position ?? 0,
    createdAt: new Date(),
  }).value;
};

export interface MockProductImageRepository {
  findById: Mock;
  findByProductId: Mock;
  save: Mock;
  saveMany: Mock;
  delete: Mock;
  countByProductId: Mock;
}

export const createMockProductImageRepository = (): MockProductImageRepository => ({
  findById: vi.fn(),
  findByProductId: vi.fn(),
  save: vi.fn(),
  saveMany: vi.fn(),
  delete: vi.fn(),
  countByProductId: vi.fn(),
});
