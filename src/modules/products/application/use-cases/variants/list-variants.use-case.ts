import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { VariantRepository } from '../../ports/variant.repository.interface';
import { ProductRepository } from '../../ports/product.repository.interface';

export interface ListVariantsInput {
  productId: string;
}

export interface VariantOutput {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  priceOverride?: number;
  stock: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListVariantsOutput {
  variants: VariantOutput[];
  total: number;
}

/**
 * Use Case: List Variants
 *
 * Lists all variants for a given product.
 * Validates that the product exists.
 */
export class ListVariantsUseCase implements UseCase<ListVariantsInput, ListVariantsOutput> {
  constructor(
    private readonly variantRepository: VariantRepository,
    private readonly productRepository: ProductRepository
  ) {}

  async execute(input: ListVariantsInput): Promise<Result<ListVariantsOutput>> {
    // Verify the product exists
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      return Result.fail('Le produit n\'existe pas');
    }

    // Get all variants for the product
    const variants = await this.variantRepository.findByProductId(input.productId);

    // Map to output format
    const variantOutputs: VariantOutput[] = variants.map((variant) => ({
      id: variant.idString,
      productId: variant.productId,
      name: variant.name,
      sku: variant.sku,
      priceOverride: variant.priceOverride?.displayAmount,
      stock: variant.stock,
      isAvailable: variant.isAvailable,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    }));

    return Result.ok({
      variants: variantOutputs,
      total: variantOutputs.length,
    });
  }
}
