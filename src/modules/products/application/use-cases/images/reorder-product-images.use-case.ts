import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { ProductImageRepository } from '../../ports/product-image.repository.interface';
import { ProductImage } from '../../../domain/entities/product-image.entity';

export interface ReorderProductImagesInput {
  productId: string;
  imageIds: string[]; // New order of image IDs
}

export interface ReorderProductImagesOutput {
  images: Array<{
    id: string;
    position: number;
  }>;
}

/**
 * Use Case: Reorder Product Images
 *
 * Reorders product images based on the provided order of image IDs.
 * The first ID in the array becomes position 0 (main image).
 */
export class ReorderProductImagesUseCase
  implements UseCase<ReorderProductImagesInput, ReorderProductImagesOutput>
{
  constructor(
    private readonly productImageRepository: ProductImageRepository
  ) {}

  async execute(
    input: ReorderProductImagesInput
  ): Promise<Result<ReorderProductImagesOutput>> {
    // Validate input
    if (!input.productId?.trim()) {
      return Result.fail('Product ID est requis');
    }

    if (!input.imageIds || input.imageIds.length === 0) {
      return Result.fail('La liste des images est requise');
    }

    // Get existing images
    const existingImages = await this.productImageRepository.findByProductId(
      input.productId
    );

    if (existingImages.length === 0) {
      return Result.fail('Ce produit n\'a aucune image');
    }

    // Validate that all IDs match
    if (input.imageIds.length !== existingImages.length) {
      return Result.fail(
        `Le nombre d'images ne correspond pas: ${input.imageIds.length} fournis, ${existingImages.length} existants`
      );
    }

    // Create a map for quick lookup
    const imageMap = new Map<string, ProductImage>();
    for (const image of existingImages) {
      imageMap.set(image.idString, image);
    }

    // Validate all provided IDs exist
    for (const imageId of input.imageIds) {
      if (!imageMap.has(imageId)) {
        return Result.fail(`Image non trouvée: ${imageId}`);
      }
    }

    // Update positions based on new order
    const reorderedImages: ProductImage[] = [];
    for (const [index, imageId] of input.imageIds.entries()) {
      const image = imageMap.get(imageId);
      if (!image) {
        return Result.fail(`Image non trouvée: ${imageId}`);
      }
      const updateResult = image.updatePosition(index);
      if (updateResult.isFailure) {
        return Result.fail(updateResult.error!);
      }
      reorderedImages.push(image);
    }

    // Save all images
    await this.productImageRepository.saveMany(reorderedImages);

    // Return the new order
    return Result.ok({
      images: reorderedImages.map((img) => ({
        id: img.idString,
        position: img.position,
      })),
    });
  }
}
