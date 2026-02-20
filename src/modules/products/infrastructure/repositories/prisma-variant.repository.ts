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

  async save(variant: ProductVariant): Promise<void> {
    const data = {
      productId: variant.productId,
      name: variant.name,
      priceOverride: variant.priceOverride?.amount ?? null,
      stock: variant.stock,
      color: variant.color ?? null,
      colorCode: variant.colorCode ?? null,
      images: variant.images.length > 0 ? variant.images : [],
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
      priceOverrideAmount: prismaVariant.priceOverride ?? undefined,
      priceOverrideCurrency: prismaVariant.priceOverride ? 'EUR' : undefined,
      stock: prismaVariant.stock,
      color: prismaVariant.color ?? undefined,
      colorCode: prismaVariant.colorCode ?? undefined,
      images: Array.isArray(prismaVariant.images) ? (prismaVariant.images as string[]) : [],
      createdAt: prismaVariant.createdAt,
      updatedAt: prismaVariant.updatedAt,
    });

    if (result.isFailure) {
      throw new Error(`Failed to reconstitute ProductVariant ${prismaVariant.id}: ${result.error}`);
    }

    return result.value;
  }
}
