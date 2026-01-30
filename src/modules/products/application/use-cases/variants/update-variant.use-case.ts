import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { Money } from '../../../domain/value-objects/money.vo';
import { VariantRepository } from '../../ports/variant.repository.interface';

export interface UpdateVariantInput {
  id: string;
  name?: string;
  sku?: string;
  removeSku?: boolean;
  priceOverride?: number;
  removePriceOverride?: boolean;
  stock?: number;
}

export interface UpdateVariantOutput {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  priceOverride?: number;
  stock: number;
  isAvailable: boolean;
}

/**
 * Use Case: Update Variant
 *
 * Updates an existing variant's properties.
 * Validates that the variant exists and SKU is unique if changed.
 */
export class UpdateVariantUseCase implements UseCase<UpdateVariantInput, UpdateVariantOutput> {
  constructor(private readonly variantRepository: VariantRepository) {}

  async execute(input: UpdateVariantInput): Promise<Result<UpdateVariantOutput>> {
    // Find the existing variant
    const variant = await this.variantRepository.findById(input.id);
    if (!variant) {
      return Result.fail('La variante n\'existe pas');
    }

    // Update name if provided
    if (input.name !== undefined) {
      const updateNameResult = variant.updateName(input.name);
      if (updateNameResult.isFailure) {
        return Result.fail(updateNameResult.error!);
      }
    }

    // Update stock if provided
    if (input.stock !== undefined) {
      const updateStockResult = variant.updateStock(input.stock);
      if (updateStockResult.isFailure) {
        return Result.fail(updateStockResult.error!);
      }
    }

    // Update SKU if provided
    if (input.removeSku) {
      variant.updateSku(undefined);
    } else if (input.sku !== undefined) {
      // Check SKU uniqueness if different from current
      if (input.sku !== variant.sku) {
        const existingVariant = await this.variantRepository.findBySku(input.sku);
        if (existingVariant && existingVariant.idString !== variant.idString) {
          return Result.fail('Ce SKU est déjà utilisé par une autre variante');
        }
      }
      variant.updateSku(input.sku);
    }

    // Update price override if provided
    if (input.removePriceOverride) {
      variant.updatePrice(undefined);
    } else if (input.priceOverride !== undefined) {
      const moneyResult = Money.create(input.priceOverride);
      if (moneyResult.isFailure) {
        return Result.fail(moneyResult.error!);
      }
      variant.updatePrice(moneyResult.value!);
    }

    // Persist the changes
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
