import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { Product } from '../../../domain/entities/product.entity';
import { Project } from '../../../domain/entities/project.entity';
import { ProductImage } from '../../../domain/entities/product-image.entity';

export interface ProjectProductsRepository {
  findPublishedProjectById(id: string): Promise<Project | null>;

  findPublishedProductsByProjectIdWithPagination(
    projectId: string,
    options: {
      skip: number;
      take: number;
    }
  ): Promise<{ products: Product[]; total: number }>;

  findMainImagesByProductIds(productIds: string[]): Promise<ProductImage[]>;
}

export interface ListProductsByProjectInput {
  projectId: string;
  page: number;
  limit: number;
}

export interface PublicProjectOutput {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
}

export interface PublicProjectProductItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  priceCurrency: string;
  mainImageUrl?: string;
  publishedAt?: Date;
}

export interface ListProductsByProjectOutput {
  project: PublicProjectOutput;
  products: PublicProjectProductItem[];
  total: number;
  pages: number;
}

/**
 * Use Case: List Products By Project
 *
 * Lists products of a specific project with pagination.
 * Only returns PUBLISHED products from PUBLISHED projects.
 * Does not expose sensitive data like creatorId.
 */
export class ListProductsByProjectUseCase implements UseCase<ListProductsByProjectInput, ListProductsByProjectOutput> {
  constructor(private readonly repository: ProjectProductsRepository) {}

  async execute(input: ListProductsByProjectInput): Promise<Result<ListProductsByProjectOutput>> {
    // Validate input
    if (!input.projectId?.trim()) {
      return Result.fail('Project ID est requis');
    }

    const projectId = input.projectId.trim();

    // Find published project
    const project = await this.repository.findPublishedProjectById(projectId);

    if (!project) {
      return Result.fail('Projet non trouve');
    }

    const skip = (input.page - 1) * input.limit;

    // Fetch published products with pagination
    const { products, total } = await this.repository.findPublishedProductsByProjectIdWithPagination(
      projectId,
      {
        skip,
        take: input.limit,
      }
    );

    // Get main images for all products
    const imageMap = new Map<string, string>();
    if (products.length > 0) {
      const productIds = products.map((p) => p.idString);
      const mainImages = await this.repository.findMainImagesByProductIds(productIds);

      for (const image of mainImages) {
        imageMap.set(image.productId, image.url.url);
      }
    }

    // Map project to public DTO (without creatorId)
    const projectDto: PublicProjectOutput = {
      id: project.idString,
      name: project.name,
      description: project.description,
      coverImage: project.coverImage,
    };

    // Map products to public DTOs (without creatorId)
    const productList: PublicProjectProductItem[] = products.map((product) => ({
      id: product.idString,
      name: product.name,
      description: product.description,
      price: product.price.displayAmount,
      priceCurrency: product.price.currency,
      mainImageUrl: imageMap.get(product.idString),
      publishedAt: product.publishedAt,
    }));

    return Result.ok({
      project: projectDto,
      products: productList,
      total,
      pages: total > 0 ? Math.ceil(total / input.limit) : 0,
    });
  }
}
