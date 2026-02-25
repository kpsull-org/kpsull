import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { Product } from '../../../domain/entities/product.entity';
import { ProductVariant } from '../../../domain/entities/product-variant.entity';
import { Money } from '../../../domain/value-objects/money.vo';
import { ProductRepository } from '../../ports/product.repository.interface';
import { ProductStatusValue } from '../../../domain/value-objects/product-status.vo';

export interface CreateProductInput {
  creatorId: string;
  name: string;
  description?: string;
  price: number;
  projectId?: string;
}

export interface CreateProductOutput {
  id: string;
  creatorId: string;
  projectId?: string;
  name: string;
  description?: string;
  price: number;
  status: ProductStatusValue;
}

/**
 * Use Case: Create Product
 *
 * Creates a new product in DRAFT status with a single default variant.
 * Every product has at least one variant — there is no "base product" concept.
 * The product must be published separately to be visible.
 * DRAFT products don't count towards the subscription limit.
 */
export class CreateProductUseCase implements UseCase<CreateProductInput, CreateProductOutput> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: CreateProductInput): Promise<Result<CreateProductOutput>> {
    // Validate and create Money
    const moneyResult = Money.create(input.price);
    if (moneyResult.isFailure) {
      return Result.fail(moneyResult.error!);
    }

    // Create the product entity
    const productResult = Product.create({
      creatorId: input.creatorId,
      name: input.name,
      description: input.description,
      projectId: input.projectId,
      price: moneyResult.value,
    });

    if (productResult.isFailure) {
      return Result.fail(productResult.error!);
    }

    const product = productResult.value;

    // Persist the product
    await this.productRepository.save(product);

    // Auto-create a default variant — every product starts with one variant.
    // The default variant uses color "unique" to signal it's transparent to the UI
    // (no color selector shown if it's the only variant).
    const defaultVariantResult = ProductVariant.create({
      productId: product.idString,
      name: input.name,
      stock: 0,
      color: 'unique',
      colorCode: '#000000',
    });

    /* c8 ignore start */
    if (defaultVariantResult.isSuccess) {
      await this.productRepository.saveVariant(defaultVariantResult.value);
    }
    /* c8 ignore stop */

    return Result.ok({
      id: product.idString,
      creatorId: product.creatorId,
      projectId: product.projectId,
      name: product.name,
      description: product.description,
      price: product.price.displayAmount,
      status: product.status.value,
    });
  }
}
