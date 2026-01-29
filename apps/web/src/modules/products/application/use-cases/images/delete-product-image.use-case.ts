import { Result } from '@/shared/domain';
import { UseCaseWithoutOutput } from '@/shared/application/use-case.interface';
import { ImageUploadService } from '../../ports/image-upload.service.interface';
import { ProductImageRepository } from '../../ports/product-image.repository.interface';

export interface DeleteProductImageInput {
  imageId: string;
}

/**
 * Use Case: Delete Product Image
 *
 * Deletes an image from storage and the database.
 * Reorders remaining images to maintain consecutive positions.
 */
export class DeleteProductImageUseCase
  implements UseCaseWithoutOutput<DeleteProductImageInput>
{
  constructor(
    private readonly imageUploadService: ImageUploadService,
    private readonly productImageRepository: ProductImageRepository
  ) {}

  async execute(input: DeleteProductImageInput): Promise<Result<void>> {
    // Validate input
    if (!input.imageId?.trim()) {
      return Result.fail("L'ID de l'image est requis");
    }

    // Find the image
    const image = await this.productImageRepository.findById(input.imageId);
    if (!image) {
      return Result.fail('Image non trouvée');
    }

    const productId = image.productId;

    // Delete from storage (best effort - don't fail if storage delete fails)
    const storageDeleteResult = await this.imageUploadService.delete(image.url.url);
    if (storageDeleteResult.isFailure) {
      // Log the error but continue with database deletion
      console.warn(
        `Failed to delete image from storage: ${storageDeleteResult.error}`
      );
    }

    // Delete from database
    await this.productImageRepository.delete(input.imageId);

    // Reorder remaining images
    const remainingImages = await this.productImageRepository.findByProductId(productId);

    if (remainingImages.length > 0) {
      // Update positions to be consecutive starting from 0
      remainingImages.forEach((img, index) => {
        img.updatePosition(index);
      });

      await this.productImageRepository.saveMany(remainingImages);
    }

    return Result.ok();
  }
}
