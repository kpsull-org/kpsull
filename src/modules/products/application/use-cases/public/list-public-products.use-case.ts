import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { Product } from '../../../domain/entities/product.entity';

export interface PublicProductListRepository {
  findPublishedByCreatorSlugWithPagination(
    creatorSlug: string,
    options: {
      projectId?: string;
      search?: string;
      skip: number;
      take: number;
    }
  ): Promise<{ products: Product[]; total: number }>;

  findFirstVariantImagesByProductIds(
    productIds: string[]
  ): Promise<{ productId: string; url: string }[]>;
}

export interface ListPublicProductsInput {
  creatorSlug: string;
  projectId?: string;
  search?: string;
  page: number;
  limit: number;
}

export interface PublicProductListItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  priceCurrency: string;
  projectId?: string;
  mainImageUrl?: string;
  publishedAt?: Date;
}

export interface ListPublicProductsOutput {
  products: PublicProductListItem[];
  total: number;
  pages: number;
}

/**
 * Use Case: List Public Products
 *
 * Lists published products of a creator with pagination.
 * Only returns PUBLISHED products.
 * Does not expose sensitive data like creatorId.
 * Main image is the first image of the first variant.
 */
export class ListPublicProductsUseCase implements UseCase<ListPublicProductsInput, ListPublicProductsOutput> {
  constructor(private readonly productRepository: PublicProductListRepository) {}

  async execute(input: ListPublicProductsInput): Promise<Result<ListPublicProductsOutput>> {
    // Validate input
    if (!input.creatorSlug?.trim()) {
      return Result.fail('Creator slug est requis');
    }

    const skip = (input.page - 1) * input.limit;

    // Fetch products with pagination
    const { products, total } = await this.productRepository.findPublishedByCreatorSlugWithPagination(
      input.creatorSlug.trim().toLowerCase(),
      {
        projectId: input.projectId,
        search: input.search,
        skip,
        take: input.limit,
      }
    );

    // Handle empty result
    if (products.length === 0) {
      return Result.ok({
        products: [],
        total: 0,
        pages: 0,
      });
    }

    // Get first variant image for all products
    const productIds = products.map((p) => p.idString);
    const firstImages = await this.productRepository.findFirstVariantImagesByProductIds(productIds);

    // Create a map of productId -> mainImageUrl
    const imageMap = new Map<string, string>();
    for (const { productId, url } of firstImages) {
      imageMap.set(productId, url);
    }

    // Map to public DTOs (without creatorId)
    const productList: PublicProductListItem[] = products.map((product) => ({
      id: product.idString,
      name: product.name,
      description: product.description,
      price: product.price.displayAmount,
      priceCurrency: product.price.currency,
      projectId: product.projectId,
      mainImageUrl: imageMap.get(product.idString),
      publishedAt: product.publishedAt,
    }));

    return Result.ok({
      products: productList,
      total,
      pages: Math.ceil(total / input.limit),
    });
  }
}
