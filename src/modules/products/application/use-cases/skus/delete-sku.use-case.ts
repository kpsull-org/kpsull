import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { SkuRepository } from '../../ports/sku.repository.interface';

export interface DeleteSkuInput {
  id: string;
}

export interface DeleteSkuOutput {
  id: string;
}

export class DeleteSkuUseCase implements UseCase<DeleteSkuInput, DeleteSkuOutput> {
  constructor(private readonly skuRepository: SkuRepository) {}

  async execute(input: DeleteSkuInput): Promise<Result<DeleteSkuOutput>> {
    const sku = await this.skuRepository.findById(input.id);
    if (!sku) {
      return Result.fail("Le SKU n'existe pas");
    }

    await this.skuRepository.delete(input.id);

    return Result.ok({ id: input.id });
  }
}
