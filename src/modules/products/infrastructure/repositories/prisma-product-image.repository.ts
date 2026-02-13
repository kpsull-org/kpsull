import { Prisma, PrismaClient } from '@prisma/client';
import { ProductImageRepository } from '../../application/ports/product-image.repository.interface';
import { ProductImage } from '../../domain/entities/product-image.entity';

type PrismaProductImage = Prisma.ProductImageGetPayload<object>;

export class PrismaProductImageRepository implements ProductImageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<ProductImage | null> {
    const prismaImage = await this.prisma.productImage.findUnique({
      where: { id },
    });

    if (!prismaImage) {
      return null;
    }

    return this.toDomainImage(prismaImage);
  }

  async findByProductId(productId: string): Promise<ProductImage[]> {
    const prismaImages = await this.prisma.productImage.findMany({
      where: { productId },
      orderBy: { position: 'asc' },
    });

    return prismaImages.map((img) => this.toDomainImage(img));
  }

  async save(image: ProductImage): Promise<void> {
    const data = {
      productId: image.productId,
      url: image.url.url,
      alt: image.alt,
      position: image.position,
    };

    await this.prisma.productImage.upsert({
      where: { id: image.idString },
      create: {
        id: image.idString,
        ...data,
        createdAt: image.createdAt,
      },
      update: data,
    });
  }

  async saveMany(images: ProductImage[]): Promise<void> {
    await this.prisma.$transaction(
      images.map((image) => {
        const data = {
          productId: image.productId,
          url: image.url.url,
          alt: image.alt,
          position: image.position,
        };

        return this.prisma.productImage.upsert({
          where: { id: image.idString },
          create: {
            id: image.idString,
            ...data,
            createdAt: image.createdAt,
          },
          update: data,
        });
      })
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.productImage.delete({ where: { id } });
  }

  async countByProductId(productId: string): Promise<number> {
    return this.prisma.productImage.count({
      where: { productId },
    });
  }

  private toDomainImage(prismaImage: PrismaProductImage): ProductImage {
    const result = ProductImage.reconstitute({
      id: prismaImage.id,
      productId: prismaImage.productId,
      url: prismaImage.url,
      urlType: 'product',
      alt: prismaImage.alt,
      position: prismaImage.position,
      createdAt: prismaImage.createdAt,
    });

    if (result.isFailure) {
      throw new Error(`Failed to reconstitute ProductImage ${prismaImage.id}: ${result.error}`);
    }

    return result.value;
  }
}
