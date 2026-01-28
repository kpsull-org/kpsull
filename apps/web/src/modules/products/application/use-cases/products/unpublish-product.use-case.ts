import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { ProductRepository } from '../../ports/product.repository.interface';
import { SubscriptionService } from '../../ports/subscription.service.interface';

export interface UnpublishProductInput {
  productId: string;
  creatorId: string;
}

export interface UnpublishProductOutput {
  unpublished: boolean;
}

/**
 * Use Case: Unpublish Product
 *
 * Unpublishes a product, making it a draft again.
 * Decrements the subscription's product count.
 */
export class UnpublishProductUseCase implements UseCase<UnpublishProductInput, UnpublishProductOutput> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly subscriptionService: SubscriptionService
  ) {}

  async execute(input: UnpublishProductInput): Promise<Result<UnpublishProductOutput>> {
    // Validate input
    if (!input.productId?.trim()) {
      return Result.fail('Product ID est requis');
    }

    if (!input.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    // Find the product
    const product = await this.productRepository.findById(input.productId);

    if (!product) {
      return Result.fail('Produit non trouvé');
    }

    // Verify ownership
    if (product.creatorId !== input.creatorId) {
      return Result.fail('Non autorisé à modifier ce produit');
    }

    // Check if already draft
    if (product.isDraft) {
      return Result.fail('Le produit est déjà en brouillon');
    }

    // Unpublish the product
    const unpublishResult = product.unpublish();

    if (unpublishResult.isFailure) {
      return Result.fail(unpublishResult.error!);
    }

    // Persist changes
    await this.productRepository.save(product);

    // Decrement subscription product count
    await this.subscriptionService.decrementProductCount(input.creatorId);

    return Result.ok({
      unpublished: true,
    });
  }
}
