import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { Money } from '../../../domain/value-objects/money.vo';
import { VariantRepository } from '../../ports/variant.repository.interface';

export interface UpdateVariantInput {
  id: string;
  name?: string;
  priceOverride?: number;
  removePriceOverride?: boolean;
  stock?: number;
  color?: string;
  colorCode?: string;
  removeColor?: boolean;
}

export interface UpdateVariantOutput {
  id: string;
  productId: string;
  name: string;
  priceOverride?: number;
  stock: number;
  color?: string;
  colorCode?: string;
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

    const priceResult = this.updatePrice(variant, input);
    if (priceResult?.isFailure) return priceResult;

    if (input.removeColor) {
      variant.updateColor(undefined, undefined);
    } else if (input.color !== undefined || input.colorCode !== undefined) {
      variant.updateColor(input.color, input.colorCode);
    }

    await this.variantRepository.save(variant);

    return Result.ok({
      id: variant.idString,
      productId: variant.productId,
      name: variant.name,
      priceOverride: variant.priceOverride?.displayAmount,
      stock: variant.stock,
      color: variant.color,
      colorCode: variant.colorCode,
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
