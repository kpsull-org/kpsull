import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { ProductRepository } from '../../ports/product.repository.interface';

export interface DeleteProductInput {
  productId: string;
  creatorId: string;
}

export interface DeleteProductOutput {
  deleted: boolean;
}

export class DeleteProductUseCase implements UseCase<DeleteProductInput, DeleteProductOutput> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: DeleteProductInput): Promise<Result<DeleteProductOutput>> {
    if (!input.productId?.trim()) {
      return Result.fail('Product ID est requis');
    }

    if (!input.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    const product = await this.productRepository.findById(input.productId);

    if (!product) {
      return Result.fail('Produit non trouve');
    }

    if (product.creatorId !== input.creatorId) {
      return Result.fail("Vous n'etes pas autorise a supprimer ce produit");
    }

    await this.productRepository.delete(input.productId);

    return Result.ok({ deleted: true });
  }
}
