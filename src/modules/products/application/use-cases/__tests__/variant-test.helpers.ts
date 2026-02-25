import { vi, type Mock } from 'vitest';
import { Product } from '../../../domain/entities/product.entity';

export interface MockVariantRepo {
  findById: Mock;
  findByProductId: Mock;
  save: Mock;
  delete: Mock;
  countByProductId: Mock;
}

export interface MockProductRepo {
  findById: Mock;
  findByCreatorId: Mock;
  save: Mock;
  delete: Mock;
  countByCreatorId: Mock;
}

export function createMockVariantRepo(): MockVariantRepo {
  return {
    findById: vi.fn(),
    findByProductId: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    countByProductId: vi.fn(),
  };
}

export function createMockProductRepo(): MockProductRepo {
  return {
    findById: vi.fn(),
    findByCreatorId: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    countByCreatorId: vi.fn(),
  };
}

export function createValidTestProduct(): Product {
  return Product.reconstitute({
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
}
