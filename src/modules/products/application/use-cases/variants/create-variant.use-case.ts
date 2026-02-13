import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { ProductVariant } from '../../../domain/entities/product-variant.entity';
import { Money } from '../../../domain/value-objects/money.vo';
import { VariantRepository } from '../../ports/variant.repository.interface';
import { ProductRepository } from '../../ports/product.repository.interface';

export interface CreateVariantInput {
  productId: string;
  name: string;
  sku?: string;
  priceOverride?: number;
  stock: number;
}

export interface CreateVariantOutput {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  priceOverride?: number;
  stock: number;
  isAvailable: boolean;
}

/**
 * Use Case: Create Variant
 *
 * Creates a new variant for an existing product.
 * Validates that the product exists and SKU is unique if provided.
 */
export class CreateVariantUseCase implements UseCase<CreateVariantInput, CreateVariantOutput> {
  constructor(
    private readonly variantRepository: VariantRepository,
    private readonly productRepository: ProductRepository
  ) {}

  async execute(input: CreateVariantInput): Promise<Result<CreateVariantOutput>> {
    // Verify the product exists
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      return Result.fail('Le produit n\'existe pas');
    }

    // Check SKU uniqueness if provided
    if (input.sku) {
      const existingVariant = await this.variantRepository.findBySku(input.sku);
      if (existingVariant) {
        return Result.fail('Ce SKU est déjà utilisé par une autre variante');
      }
    }

    // Create price override if provided
    let priceOverride: Money | undefined;
    if (input.priceOverride !== undefined) {
      const moneyResult = Money.create(input.priceOverride);
      if (moneyResult.isFailure) {
        return Result.fail(moneyResult.error!);
      }
      priceOverride = moneyResult.value;
    }

    // Create the variant entity
    const variantResult = ProductVariant.create({
      productId: input.productId,
      name: input.name,
      sku: input.sku,
      priceOverride,
      stock: input.stock,
    });

    if (variantResult.isFailure) {
      return Result.fail(variantResult.error!);
    }

    const variant = variantResult.value;

    // Persist the variant
    await this.variantRepository.save(variant);

    return Result.ok({
      id: variant.idString,
      productId: variant.productId,
      name: variant.name,
      sku: variant.sku,
      priceOverride: variant.priceOverride?.displayAmount,
      stock: variant.stock,
      isAvailable: variant.isAvailable,
    });
  }
}
