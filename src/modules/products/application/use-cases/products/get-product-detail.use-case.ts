import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { ProductRepository } from '../../ports/product.repository.interface';
import { ProductStatusValue } from '../../../domain/value-objects/product-status.vo';

export interface GetProductDetailInput {
  productId: string;
  creatorId: string;
}

export interface GetProductDetailOutput {
  id: string;
  creatorId: string;
  projectId?: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  status: ProductStatusValue;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class GetProductDetailUseCase implements UseCase<GetProductDetailInput, GetProductDetailOutput> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: GetProductDetailInput): Promise<Result<GetProductDetailOutput>> {
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
      return Result.fail("Vous n'etes pas autorise a voir ce produit");
    }

    return Result.ok({
      id: product.idString,
      creatorId: product.creatorId,
      projectId: product.projectId,
      name: product.name,
      description: product.description,
      price: product.price.amount,
      currency: product.price.currency,
      status: product.status.value,
      publishedAt: product.publishedAt,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
  }
}
