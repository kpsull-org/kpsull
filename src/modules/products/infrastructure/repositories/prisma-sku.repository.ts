import { Prisma, PrismaClient } from '@prisma/client';
import { SkuRepository } from '../../application/ports/sku.repository.interface';
import { ProductSku } from '../../domain/entities/product-sku.entity';

type PrismaSku = Prisma.ProductSkuGetPayload<object>;

export class PrismaSkuRepository implements SkuRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<ProductSku | null> {
    const prismaSku = await this.prisma.productSku.findUnique({ where: { id } });
    if (!prismaSku) return null;
    return this.toDomain(prismaSku);
  }

  async findByProductId(productId: string): Promise<ProductSku[]> {
    const prismaSkus = await this.prisma.productSku.findMany({
      where: { productId },
      orderBy: [{ variantId: 'asc' }, { size: 'asc' }],
    });
    return prismaSkus.map((s) => this.toDomain(s));
  }

  async findByVariantId(variantId: string): Promise<ProductSku[]> {
    const prismaSkus = await this.prisma.productSku.findMany({
      where: { variantId },
    });
    return prismaSkus.map((s) => this.toDomain(s));
  }

  async upsert(sku: ProductSku): Promise<void> {
    await this.prisma.productSku.upsert({
      where: { id: sku.idString },
      create: {
        id: sku.idString,
        productId: sku.productId,
        variantId: sku.variantId ?? null,
        size: sku.size ?? null,
        stock: sku.stock,
        createdAt: sku.createdAt,
      },
      update: {
        stock: sku.stock,
        updatedAt: sku.updatedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.productSku.delete({ where: { id } });
  }

  async deleteByProductId(productId: string): Promise<void> {
    await this.prisma.productSku.deleteMany({ where: { productId } });
  }

  private toDomain(prismaSku: PrismaSku): ProductSku {
    const result = ProductSku.reconstitute({
      id: prismaSku.id,
      productId: prismaSku.productId,
      variantId: prismaSku.variantId ?? undefined,
      size: prismaSku.size ?? undefined,
      stock: prismaSku.stock,
      createdAt: prismaSku.createdAt,
      updatedAt: prismaSku.updatedAt,
    });

    if (result.isFailure) {
      throw new Error(`Failed to reconstitute ProductSku ${prismaSku.id}: ${result.error}`);
    }

    return result.value;
  }
}
