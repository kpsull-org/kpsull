import { Prisma, PrismaClient } from '@prisma/client';
import { VariantRepository } from '../../application/ports/variant.repository.interface';
import { ProductVariant } from '../../domain/entities/product-variant.entity';

type PrismaVariant = Prisma.ProductVariantGetPayload<object>;

export class PrismaVariantRepository implements VariantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<ProductVariant | null> {
    const prismaVariant = await this.prisma.productVariant.findUnique({
      where: { id },
    });

    if (!prismaVariant) {
      return null;
    }

    return this.toDomainVariant(prismaVariant);
  }

  async findByProductId(productId: string): Promise<ProductVariant[]> {
    const prismaVariants = await this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: { name: 'asc' },
    });

    return prismaVariants.map((v) => this.toDomainVariant(v));
  }

  async findBySku(sku: string): Promise<ProductVariant | null> {
    const prismaVariant = await this.prisma.productVariant.findFirst({
      where: { sku },
    });

    if (!prismaVariant) {
      return null;
    }

    return this.toDomainVariant(prismaVariant);
  }

  async save(variant: ProductVariant): Promise<void> {
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

  async delete(id: string): Promise<void> {
    await this.prisma.productVariant.delete({ where: { id } });
  }

  async countByProductId(productId: string): Promise<number> {
    return this.prisma.productVariant.count({
      where: { productId },
    });
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

    return result.value!;
  }
}
