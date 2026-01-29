import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { validateImageFile } from '@/lib/utils/file-validation';
import { ProductImage } from '../../../domain/entities/product-image.entity';
import { ImageUrl } from '../../../domain/value-objects/image-url.vo';
import { ImageUploadService } from '../../ports/image-upload.service.interface';
import { ProductImageRepository } from '../../ports/product-image.repository.interface';
import { ProductRepository } from '../../ports/product.repository.interface';

export interface UploadProductImageInput {
  productId: string;
  file: Buffer;
  filename: string;
  alt?: string;
}

export interface UploadProductImageOutput {
  id: string;
  productId: string;
  url: string;
  alt: string;
  position: number;
}

/**
 * Use Case: Upload Product Image
 *
 * Uploads an image file and associates it with a product.
 * The image position is automatically set based on existing images.
 */
export class UploadProductImageUseCase
  implements UseCase<UploadProductImageInput, UploadProductImageOutput>
{
  constructor(
    private readonly imageUploadService: ImageUploadService,
    private readonly productImageRepository: ProductImageRepository,
    private readonly productRepository: ProductRepository
  ) {}

  async execute(input: UploadProductImageInput): Promise<Result<UploadProductImageOutput>> {
    // Validate image file (size, extension, MIME type)
    const validationResult = validateImageFile(input.file, input.filename);
    if (validationResult.isFailure) {
      return Result.fail(validationResult.error!);
    }

    // Verify product exists
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      return Result.fail('Produit non trouvé');
    }

    // Get current image count to determine position
    const imageCount = await this.productImageRepository.countByProductId(input.productId);

    // Upload the file
    const uploadResult = await this.imageUploadService.upload(input.file, input.filename);
    if (uploadResult.isFailure) {
      return Result.fail(uploadResult.error!);
    }

    const uploadedUrl = uploadResult.value!;

    // Create ImageUrl value object
    const imageUrlResult = ImageUrl.create(uploadedUrl, 'product');
    if (imageUrlResult.isFailure) {
      // If URL validation fails, try to clean up the uploaded file
      await this.imageUploadService.delete(uploadedUrl);
      return Result.fail(imageUrlResult.error!);
    }

    // Create ProductImage entity
    const productImageResult = ProductImage.create({
      productId: input.productId,
      url: imageUrlResult.value!,
      alt: input.alt ?? '',
      position: imageCount, // Next available position
    });

    if (productImageResult.isFailure) {
      // Clean up uploaded file on failure
      await this.imageUploadService.delete(uploadedUrl);
      return Result.fail(productImageResult.error!);
    }

    const productImage = productImageResult.value!;

    // Save to repository
    await this.productImageRepository.save(productImage);

    return Result.ok({
      id: productImage.idString,
      productId: productImage.productId,
      url: productImage.url.url,
      alt: productImage.alt,
      position: productImage.position,
    });
  }
}
