import { Prisma, PrismaClient, ProductStatus as PrismaProductStatus } from '@prisma/client';
import { PublicProductListRepository } from '../../application/use-cases/public/list-public-products.use-case';
import { PublicProductRepository, type PublicCreatorOutput } from '../../application/use-cases/public/get-public-product.use-case';
import { ProjectProductsRepository } from '../../application/use-cases/public/list-products-by-project.use-case';
import { Product } from '../../domain/entities/product.entity';
import { ProductVariant } from '../../domain/entities/product-variant.entity';
import { Project } from '../../domain/entities/project.entity';

export class PrismaPublicProductRepository
  implements PublicProductListRepository, PublicProductRepository, ProjectProductsRepository
{
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

  async findFirstVariantImagesByProductIds(
    productIds: string[]
  ): Promise<{ productId: string; url: string }[]> {
    if (productIds.length === 0) {
      return [];
    }

    const variants = await this.prisma.productVariant.findMany({
      where: { productId: { in: productIds } },
      orderBy: { createdAt: 'asc' },
      select: { productId: true, images: true },
    });

    const result: { productId: string; url: string }[] = [];
    const seen = new Set<string>();
    for (const v of variants) {
      if (!seen.has(v.productId)) {
        const images = Array.isArray(v.images) ? (v.images as string[]) : [];
        if (images.length > 0) {
          result.push({ productId: v.productId, url: images[0]! });
        }
        seen.add(v.productId);
      }
    }

    return result;
  }

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

  async findCreatorByProductId(productId: string): Promise<PublicCreatorOutput | null> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        creatorId: true,
      },
    });

    if (!product) {
      return null;
    }

    const [user, creatorPage] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: product.creatorId },
        select: { name: true, image: true },
      }),
      this.prisma.creatorPage.findUnique({
        where: { creatorId: product.creatorId },
        select: { slug: true },
      }),
    ]);

    if (!user || !creatorPage) {
      return null;
    }

    return {
      name: user.name,
      image: user.image,
      slug: creatorPage.slug,
    };
  }

  async findPublishedProjectById(id: string): Promise<Project | null> {
    const prismaProject = await this.prisma.project.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!prismaProject) {
      return null;
    }

    const result = Project.reconstitute({
      id: prismaProject.id,
      creatorId: prismaProject.creatorId,
      name: prismaProject.name,
      description: prismaProject.description ?? undefined,
      coverImage: prismaProject.coverImage ?? undefined,
      productCount: prismaProject._count.products,
      createdAt: prismaProject.createdAt,
      updatedAt: prismaProject.updatedAt,
    });

    return result.isSuccess ? result.value : null;
  }

  async findPublishedProductsByProjectIdWithPagination(
    projectId: string,
    options: { skip: number; take: number }
  ): Promise<{ products: Product[]; total: number }> {
    const where: Prisma.ProductWhereInput = {
      projectId,
      status: 'PUBLISHED' as PrismaProductStatus,
    };

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

  private toDomainVariant(
    prismaVariant: Prisma.ProductVariantGetPayload<object>
  ): ProductVariant | null {
    const result = ProductVariant.reconstitute({
      id: prismaVariant.id,
      productId: prismaVariant.productId,
      name: prismaVariant.name,
      priceOverrideAmount: prismaVariant.priceOverride ?? undefined,
      priceOverrideCurrency: prismaVariant.priceOverride ? 'EUR' : undefined,
      stock: prismaVariant.stock,
      color: prismaVariant.color ?? undefined,
      colorCode: prismaVariant.colorCode ?? undefined,
      images: Array.isArray(prismaVariant.images) ? (prismaVariant.images as string[]) : [],
      createdAt: prismaVariant.createdAt,
      updatedAt: prismaVariant.updatedAt,
    });

    return result.isSuccess ? result.value : null;
  }
}
