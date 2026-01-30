import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { Product } from '../../../domain/entities/product.entity';
import { ProductStatusValue } from '../../../domain/value-objects/product-status.vo';

export interface ProductListRepository {
  findByCreatorIdWithPagination(
    creatorId: string,
    options: {
      status?: string;
      projectId?: string;
      search?: string;
      skip: number;
      take: number;
    }
  ): Promise<{ products: Product[]; total: number }>;
}

export interface ListProductsInput {
  creatorId: string;
  status?: ProductStatusValue;
  projectId?: string;
  search?: string;
  page: number;
  limit: number;
}

export interface ProductListItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  priceCurrency: string;
  status: ProductStatusValue;
  projectId?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListProductsOutput {
  products: ProductListItem[];
  total: number;
  pages: number;
}

/**
 * Use Case: List Products
 *
 * Lists products for a creator with filtering, search, and pagination.
 */
export class ListProductsUseCase implements UseCase<ListProductsInput, ListProductsOutput> {
  constructor(private readonly productRepository: ProductListRepository) {}

  async execute(input: ListProductsInput): Promise<Result<ListProductsOutput>> {
    // Validate input
    if (!input.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    const skip = (input.page - 1) * input.limit;

    // Fetch products with pagination
    const { products, total } = await this.productRepository.findByCreatorIdWithPagination(
      input.creatorId,
      {
        status: input.status,
        projectId: input.projectId,
        search: input.search,
        skip,
        take: input.limit,
      }
    );

    // Map to DTOs
    const productList: ProductListItem[] = products.map((product) => ({
      id: product.idString,
      name: product.name,
      description: product.description,
      price: product.price.amount,
      priceCurrency: product.price.currency,
      status: product.status.value,
      projectId: product.projectId,
      publishedAt: product.publishedAt,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    return Result.ok({
      products: productList,
      total,
      pages: Math.ceil(total / input.limit),
    });
  }
}
