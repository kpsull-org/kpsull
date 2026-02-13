import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { Money } from '../../../domain/value-objects/money.vo';
import { ProductRepository } from '../../ports/product.repository.interface';
import { ProductStatusValue } from '../../../domain/value-objects/product-status.vo';

export interface UpdateProductInput {
  productId: string;
  creatorId: string;
  name?: string;
  description?: string;
  price?: number;
  projectId?: string | null;
}

export interface UpdateProductOutput {
  id: string;
  creatorId: string;
  projectId?: string;
  name: string;
  description?: string;
  price: number;
  status: ProductStatusValue;
}

export class UpdateProductUseCase implements UseCase<UpdateProductInput, UpdateProductOutput> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: UpdateProductInput): Promise<Result<UpdateProductOutput>> {
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
      return Result.fail("Vous n'etes pas autorise a modifier ce produit");
    }

    if (input.name !== undefined) {
      const updateResult = product.updateName(input.name);
      if (updateResult.isFailure) {
        return Result.fail(updateResult.error!);
      }
    }

    if (input.description !== undefined) {
      product.updateDescription(input.description);
    }

    if (input.price !== undefined) {
      const moneyResult = Money.create(input.price);
      if (moneyResult.isFailure) {
        return Result.fail(moneyResult.error!);
      }
      product.updatePrice(moneyResult.value!);
    }

    if (input.projectId !== undefined) {
      product.assignToProject(input.projectId ?? undefined);
    }

    await this.productRepository.save(product);

    return Result.ok({
      id: product.idString,
      creatorId: product.creatorId,
      projectId: product.projectId,
      name: product.name,
      description: product.description,
      price: product.price.amount,
      status: product.status.value,
    });
  }
}
