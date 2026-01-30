import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { Product } from '../../../domain/entities/product.entity';
import { ProductVariant } from '../../../domain/entities/product-variant.entity';
import { ProductImage } from '../../../domain/entities/product-image.entity';

export interface PublicProductRepository {
  findPublishedById(id: string): Promise<Product | null>;
  findVariantsByProductId(productId: string): Promise<ProductVariant[]>;
  findImagesByProductId(productId: string): Promise<ProductImage[]>;
}

export interface GetPublicProductInput {
  productId: string;
}

export interface PublicVariantOutput {
  id: string;
  name: string;
  sku?: string;
  priceOverride?: number;
  stock: number;
  isAvailable: boolean;
}

export interface PublicImageOutput {
  id: string;
  url: string;
  alt: string;
  position: number;
}

export interface GetPublicProductOutput {
  id: string;
  name: string;
  description?: string;
  price: number;
  priceCurrency: string;
  projectId?: string;
  mainImageUrl?: string;
  variants: PublicVariantOutput[];
  images: PublicImageOutput[];
  publishedAt?: Date;
}

/**
 * Use Case: Get Public Product
 *
 * Retrieves a published product with its variants and images for public display.
 * Only returns PUBLISHED products.
 * Does not expose sensitive data like creatorId.
 */
export class GetPublicProductUseCase implements UseCase<GetPublicProductInput, GetPublicProductOutput> {
  constructor(private readonly productRepository: PublicProductRepository) {}

  async execute(input: GetPublicProductInput): Promise<Result<GetPublicProductOutput>> {
    // Validate input
    if (!input.productId?.trim()) {
      return Result.fail('Product ID est requis');
    }

    const productId = input.productId.trim();

    // Find published product
    const product = await this.productRepository.findPublishedById(productId);

    if (!product) {
      return Result.fail('Produit non trouve');
    }

    // Fetch variants and images in parallel
    const [variants, images] = await Promise.all([
      this.productRepository.findVariantsByProductId(productId),
      this.productRepository.findImagesByProductId(productId),
    ]);

    // Filter only available variants (stock > 0)
    const availableVariants = variants.filter((v) => v.isAvailable);

    // Sort images by position
    const sortedImages = [...images].sort((a, b) => a.position - b.position);

    // Get main image URL (position 0)
    const mainImage = sortedImages.find((img) => img.position === 0);
    const mainImageUrl = mainImage?.url.url;

    // Map variants to public DTOs
    const variantDtos: PublicVariantOutput[] = availableVariants.map((variant) => ({
      id: variant.idString,
      name: variant.name,
      sku: variant.sku,
      priceOverride: variant.priceOverride?.displayAmount,
      stock: variant.stock,
      isAvailable: variant.isAvailable,
    }));

    // Map images to public DTOs
    const imageDtos: PublicImageOutput[] = sortedImages.map((image) => ({
      id: image.idString,
      url: image.url.url,
      alt: image.alt,
      position: image.position,
    }));

    // Build public product response (without creatorId)
    const output: GetPublicProductOutput = {
      id: product.idString,
      name: product.name,
      description: product.description,
      price: product.price.displayAmount,
      priceCurrency: product.price.currency,
      projectId: product.projectId,
      mainImageUrl,
      variants: variantDtos,
      images: imageDtos,
      publishedAt: product.publishedAt,
    };

    return Result.ok(output);
  }
}
