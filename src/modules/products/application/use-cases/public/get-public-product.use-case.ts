import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { Product } from '../../../domain/entities/product.entity';
import { ProductVariant } from '../../../domain/entities/product-variant.entity';

export interface PublicProductRepository {
  findPublishedById(id: string): Promise<Product | null>;
  findVariantsByProductId(productId: string): Promise<ProductVariant[]>;
}

export interface GetPublicProductInput {
  productId: string;
}

export interface PublicVariantOutput {
  id: string;
  name: string;
  color?: string;
  colorCode?: string;
  priceOverride?: number;
  stock: number;
  isAvailable: boolean;
  images: string[];
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
  images: string[];
  publishedAt?: Date;
}

/**
 * Use Case: Get Public Product
 *
 * Retrieves a published product with its variants and images for public display.
 * Only returns PUBLISHED products.
 * Does not expose sensitive data like creatorId.
 * Images are now stored at the variant level.
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

    // Fetch variants
    const variants = await this.productRepository.findVariantsByProductId(productId);

    // Filter only available variants (stock > 0)
    const availableVariants = variants.filter((v) => v.isAvailable);

    // Flatten all images from all variants
    const allImages = variants.flatMap((v) => v.images);
    const mainImageUrl = allImages[0];

    // Map variants to public DTOs
    const variantDtos: PublicVariantOutput[] = availableVariants.map((variant) => ({
      id: variant.idString,
      name: variant.name,
      color: variant.color,
      colorCode: variant.colorCode,
      priceOverride: variant.priceOverride?.displayAmount,
      stock: variant.stock,
      isAvailable: variant.isAvailable,
      images: variant.images,
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
      images: allImages,
      publishedAt: product.publishedAt,
    };

    return Result.ok(output);
  }
}
