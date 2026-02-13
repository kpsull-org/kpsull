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
    const variant = await this.variantRepository.findById(input.id);
    if (!variant) {
      return Result.fail('La variante n\'existe pas');
    }

    const nameResult = this.updateName(variant, input);
    if (nameResult?.isFailure) return nameResult;

    const stockResult = this.updateStock(variant, input);
    if (stockResult?.isFailure) return stockResult;

    const skuResult = await this.updateSku(variant, input);
    if (skuResult?.isFailure) return skuResult;

    const priceResult = this.updatePrice(variant, input);
    if (priceResult?.isFailure) return priceResult;

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

  private updateName(variant: Awaited<ReturnType<VariantRepository['findById']>> & object, input: UpdateVariantInput): Result<UpdateVariantOutput> | null {
    if (input.name === undefined) return null;
    const result = variant.updateName(input.name);
    return result.isFailure ? Result.fail(result.error!) : null;
  }

  private updateStock(variant: Awaited<ReturnType<VariantRepository['findById']>> & object, input: UpdateVariantInput): Result<UpdateVariantOutput> | null {
    if (input.stock === undefined) return null;
    const result = variant.updateStock(input.stock);
    return result.isFailure ? Result.fail(result.error!) : null;
  }

  private async updateSku(variant: Awaited<ReturnType<VariantRepository['findById']>> & object, input: UpdateVariantInput): Promise<Result<UpdateVariantOutput> | null> {
    if (input.removeSku) {
      variant.updateSku(undefined);
      return null;
    }
    if (input.sku === undefined) return null;
    if (input.sku !== variant.sku) {
      const existing = await this.variantRepository.findBySku(input.sku);
      if (existing && existing.idString !== variant.idString) {
        return Result.fail('Ce SKU est déjà utilisé par une autre variante');
      }
    }
    variant.updateSku(input.sku);
    return null;
  }

  private updatePrice(variant: Awaited<ReturnType<VariantRepository['findById']>> & object, input: UpdateVariantInput): Result<UpdateVariantOutput> | null {
    if (input.removePriceOverride) {
      variant.updatePrice(undefined);
      return null;
    }
    if (input.priceOverride === undefined) return null;
    const moneyResult = Money.create(input.priceOverride);
    if (moneyResult.isFailure) return Result.fail(moneyResult.error!);
    variant.updatePrice(moneyResult.value);
    return null;
  }
}
