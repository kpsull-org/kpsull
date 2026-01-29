import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { VariantRepository } from '../../ports/variant.repository.interface';

export interface DeleteVariantInput {
  id: string;
}

export interface DeleteVariantOutput {
  id: string;
  productId: string;
  name: string;
}

/**
 * Use Case: Delete Variant
 *
 * Deletes an existing variant permanently.
 * Validates that the variant exists before deletion.
 */
export class DeleteVariantUseCase implements UseCase<DeleteVariantInput, DeleteVariantOutput> {
  constructor(private readonly variantRepository: VariantRepository) {}

  async execute(input: DeleteVariantInput): Promise<Result<DeleteVariantOutput>> {
    // Find the existing variant
    const variant = await this.variantRepository.findById(input.id);
    if (!variant) {
      return Result.fail('La variante n\'existe pas');
    }

    // Store info before deletion for response
    const deletedInfo = {
      id: variant.idString,
      productId: variant.productId,
      name: variant.name,
    };

    // Delete the variant
    await this.variantRepository.delete(input.id);

    return Result.ok(deletedInfo);
  }
}
