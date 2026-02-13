import { Prisma, PrismaClient, ProductStatus as PrismaProductStatus } from '@prisma/client';
import { ProductRepository } from '../../application/ports/product.repository.interface';
import type { ProductListRepository } from '../../application/use-cases/products/list-products.use-case';
import { Product } from '../../domain/entities/product.entity';
import { ProductVariant } from '../../domain/entities/product-variant.entity';
import { ProductStatusValue } from '../../domain/value-objects/product-status.vo';

type PrismaProduct = Prisma.ProductGetPayload<object>;
type PrismaVariant = Prisma.ProductVariantGetPayload<object>;

export class PrismaProductRepository implements ProductRepository, ProductListRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Product | null> {
    const prismaProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!prismaProduct) {
      return null;
    }

    return this.toDomainProduct(prismaProduct);
  }

  async findByCreatorId(
    creatorId: string,
    filters?: {
      projectId?: string;
      status?: ProductStatusValue;
    }
  ): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = { creatorId };

    if (filters?.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters?.status) {
      where.status = filters.status as PrismaProductStatus;
    }

    const prismaProducts = await this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return prismaProducts.map((p) => this.toDomainProduct(p));
  }

  async findByCreatorIdWithPagination(
    creatorId: string,
    options: {
      status?: string;
      projectId?: string;
      search?: string;
      skip: number;
      take: number;
    }
  ): Promise<{ products: Product[]; total: number }> {
    const where: Prisma.ProductWhereInput = { creatorId };

    if (options.status) {
      where.status = options.status as PrismaProductStatus;
    }

    if (options.projectId) {
      where.projectId = options.projectId;
    }

    if (options.search) {
      where.name = { contains: options.search, mode: 'insensitive' };
    }

    const [prismaProducts, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: options.skip,
        take: options.take,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products: prismaProducts.map((p) => this.toDomainProduct(p)),
      total,
    };
  }

  async save(product: Product): Promise<void> {
    const data = {
      creatorId: product.creatorId,
      projectId: product.projectId ?? null,
      name: product.name,
      description: product.description ?? null,
      price: product.price.amount,
      currency: product.price.currency,
      status: product.status.value as PrismaProductStatus,
      publishedAt: product.publishedAt ?? null,
      updatedAt: product.updatedAt,
    };

    await this.prisma.product.upsert({
      where: { id: product.idString },
      create: {
        id: product.idString,
        ...data,
        createdAt: product.createdAt,
      },
      update: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }

  async countByCreatorId(creatorId: string, status?: ProductStatusValue): Promise<number> {
    const where: Prisma.ProductWhereInput = { creatorId };

    if (status) {
      where.status = status as PrismaProductStatus;
    }

    return this.prisma.product.count({ where });
  }

  async findVariantsByProductId(productId: string): Promise<ProductVariant[]> {
    const prismaVariants = await this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: { name: 'asc' },
    });

    return prismaVariants.map((v) => this.toDomainVariant(v));
  }

  async saveVariant(variant: ProductVariant): Promise<void> {
    const data = {
      productId: variant.productId,
      name: variant.name,
      sku: variant.sku ?? null,
      priceOverride: variant.priceOverride?.amount ?? null,
      stock: variant.stock,
      updatedAt: variant.updatedAt,
    };

    await this.prisma.productVariant.upsert({
      where: { id: variant.idString },
      create: {
        id: variant.idString,
        ...data,
        createdAt: variant.createdAt,
      },
      update: data,
    });
  }

  async deleteVariant(id: string): Promise<void> {
    await this.prisma.productVariant.delete({ where: { id } });
  }

  private toDomainProduct(prismaProduct: PrismaProduct): Product {
    const result = Product.reconstitute({
      id: prismaProduct.id,
      creatorId: prismaProduct.creatorId,
      projectId: prismaProduct.projectId ?? undefined,
      name: prismaProduct.name,
      description: prismaProduct.description ?? undefined,
      priceAmount: prismaProduct.price,
      priceCurrency: prismaProduct.currency,
      status: prismaProduct.status as ProductStatusValue,
      publishedAt: prismaProduct.publishedAt ?? undefined,
      createdAt: prismaProduct.createdAt,
      updatedAt: prismaProduct.updatedAt,
    });

    if (result.isFailure) {
      throw new Error(`Failed to reconstitute Product ${prismaProduct.id}: ${result.error}`);
    }

    return result.value;
  }

  private toDomainVariant(prismaVariant: PrismaVariant): ProductVariant {
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

    if (result.isFailure) {
      throw new Error(`Failed to reconstitute ProductVariant ${prismaVariant.id}: ${result.error}`);
    }

    return result.value;
  }
}
