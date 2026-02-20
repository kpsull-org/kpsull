import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { ProductRepository } from '../../ports/product.repository.interface';
import { ProductImageRepository } from '../../ports/product-image.repository.interface';
import { VariantRepository } from '../../ports/variant.repository.interface';
import { ImageUploadService } from '../../ports/image-upload.service.interface';

export interface DeleteProductInput {
  productId: string;
  creatorId: string;
}

export interface DeleteProductOutput {
  deleted: boolean;
}

export class DeleteProductUseCase implements UseCase<DeleteProductInput, DeleteProductOutput> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productImageRepository: ProductImageRepository,
    private readonly variantRepository: VariantRepository,
    private readonly imageUploadService: ImageUploadService
  ) {}

  async execute(input: DeleteProductInput): Promise<Result<DeleteProductOutput>> {
    if (!input.productId?.trim()) {
      return Result.fail('Product ID est requis');
    }

    if (!input.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    const product = await this.productRepository.findById(input.productId);

    if (!product) {
      return Result.fail('Produit non trouve');
    }

    if (product.creatorId !== input.creatorId) {
      return Result.fail("Vous n'etes pas autorise a supprimer ce produit");
    }

    // Delete Cloudinary images (best effort - don't fail if storage delete fails)
    const [productImages, variants] = await Promise.all([
      this.productImageRepository.findByProductId(input.productId),
      this.variantRepository.findByProductId(input.productId),
    ]);

    const imageUrls = [
      ...productImages.map((img) => img.url.url),
      ...variants.flatMap((v) => v.images),
    ];

    await Promise.all(
      imageUrls.map(async (url) => {
        const result = await this.imageUploadService.delete(url);
        if (result.isFailure) {
          console.warn(`Failed to delete image from Cloudinary: ${url} - ${result.error}`);
        }
      })
    );

    await this.productRepository.delete(input.productId);

    return Result.ok({ deleted: true });
  }
}
