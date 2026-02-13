import { Prisma, PrismaClient, ProductStatus as PrismaProductStatus } from '@prisma/client';
import { PublicProductListRepository } from '../../application/use-cases/public/list-public-products.use-case';
import { PublicProductRepository } from '../../application/use-cases/public/get-public-product.use-case';
import { Product } from '../../domain/entities/product.entity';
import { ProductImage } from '../../domain/entities/product-image.entity';
import { ProductVariant } from '../../domain/entities/product-variant.entity';

export class PrismaPublicProductRepository implements PublicProductListRepository, PublicProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findPublishedByCreatorSlugWithPagination(
    creatorSlug: string,
    options: {
      projectId?: string;
      search?: string;
      skip: number;
      take: number;
    }
  ): Promise<{ products: Product[]; total: number }> {
    // First, find the creator by their page slug
    const creatorPage = await this.prisma.creatorPage.findUnique({
      where: { slug: creatorSlug },
      select: { creatorId: true },
    });

    if (!creatorPage) {
      return { products: [], total: 0 };
    }

    const where: Prisma.ProductWhereInput = {
      creatorId: creatorPage.creatorId,
      status: 'PUBLISHED' as PrismaProductStatus,
    };

    if (options.projectId) {
      where.projectId = options.projectId;
    }

    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [prismaProducts, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: options.skip,
        take: options.take,
      }),
      this.prisma.product.count({ where }),
    ]);

    const products = prismaProducts
      .map((p) => this.toDomainProduct(p))
      .filter((p): p is Product => p !== null);

    return { products, total };
  }

  async findMainImagesByProductIds(productIds: string[]): Promise<ProductImage[]> {
    if (productIds.length === 0) {
      return [];
    }

    const images = await this.prisma.productImage.findMany({
      where: {
        productId: { in: productIds },
        position: 0, // Main image
      },
    });

    return images
      .map((img) => this.toDomainImage(img))
      .filter((img): img is ProductImage => img !== null);
  }

  // PublicProductRepository methods
  async findPublishedById(id: string): Promise<Product | null> {
    const prismaProduct = await this.prisma.product.findFirst({
      where: {
        id,
        status: 'PUBLISHED' as PrismaProductStatus,
      },
    });

    if (!prismaProduct) {
      return null;
    }

    return this.toDomainProduct(prismaProduct);
  }

  async findVariantsByProductId(productId: string): Promise<ProductVariant[]> {
    const variants = await this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: { name: 'asc' },
    });

    return variants
      .map((v) => this.toDomainVariant(v))
      .filter((v): v is ProductVariant => v !== null);
  }

  async findImagesByProductId(productId: string): Promise<ProductImage[]> {
    const images = await this.prisma.productImage.findMany({
      where: { productId },
      orderBy: { position: 'asc' },
    });

    return images
      .map((img) => this.toDomainImage(img))
      .filter((img): img is ProductImage => img !== null);
  }

  private toDomainProduct(prismaProduct: Prisma.ProductGetPayload<object>): Product | null {
    const result = Product.reconstitute({
      id: prismaProduct.id,
      creatorId: prismaProduct.creatorId,
      projectId: prismaProduct.projectId ?? undefined,
      name: prismaProduct.name,
      description: prismaProduct.description ?? undefined,
      priceAmount: prismaProduct.price,
      priceCurrency: prismaProduct.currency,
      status: prismaProduct.status,
      publishedAt: prismaProduct.publishedAt ?? undefined,
      createdAt: prismaProduct.createdAt,
      updatedAt: prismaProduct.updatedAt,
    });

    return result.isSuccess ? result.value : null;
  }

  private toDomainImage(prismaImage: Prisma.ProductImageGetPayload<object>): ProductImage | null {
    const result = ProductImage.reconstitute({
      id: prismaImage.id,
      productId: prismaImage.productId,
      url: prismaImage.url,
      urlType: 'product',
      alt: prismaImage.alt,
      position: prismaImage.position,
      createdAt: prismaImage.createdAt,
    });

    return result.isSuccess ? result.value : null;
  }

  private toDomainVariant(
    prismaVariant: Prisma.ProductVariantGetPayload<object>
  ): ProductVariant | null {
    const result = ProductVariant.reconstitute({
      id: prismaVariant.id,
      productId: prismaVariant.productId,
      name: prismaVariant.name,
      sku: prismaVariant.sku ?? undefined,
      priceOverrideAmount: prismaVariant.priceOverride ?? undefined,
      priceOverrideCurrency: prismaVariant.priceOverride ? 'EUR' : undefined,
      stock: prismaVariant.stock,
      createdAt: prismaVariant.createdAt,
      updatedAt: prismaVariant.updatedAt,
    });

    return result.isSuccess ? result.value : null;
  }
}
