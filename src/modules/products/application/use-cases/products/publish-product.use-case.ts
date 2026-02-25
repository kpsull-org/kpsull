import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { ProductRepository } from '../../ports/product.repository.interface';
import { SubscriptionService } from '../../ports/subscription.service.interface';

export interface PublishProductInput {
  productId: string;
  creatorId: string;
}

export interface PublishProductOutput {
  published: boolean;
  publishedAt: Date;
  limitWarning?: string;
}

/**
 * Use Case: Publish Product
 *
 * Publishes a draft product, making it visible to customers.
 * Checks subscription limits before publishing.
 * Increments the subscription's product count.
 */
export class PublishProductUseCase implements UseCase<PublishProductInput, PublishProductOutput> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly subscriptionService: SubscriptionService
  ) {}

  async execute(input: PublishProductInput): Promise<Result<PublishProductOutput>> {
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

    // Check if already published
    if (product.isPublished) {
      return Result.fail('Le produit est déjà publié');
    }

    // Check product limit
    const limitCheck = await this.subscriptionService.checkProductLimit(input.creatorId);

    /* c8 ignore start */
    if (limitCheck.isFailure) {
      return Result.fail(limitCheck.error!);
    }
    /* c8 ignore stop */

    const limitResult = limitCheck.value;

    if (limitResult.status === 'BLOCKED') {
      return Result.fail(limitResult.message!);
    }

    // Publish the product
    const publishResult = product.publish();

    /* c8 ignore start */
    if (publishResult.isFailure) {
      return Result.fail(publishResult.error!);
    }
    /* c8 ignore stop */

    // Persist changes
    await this.productRepository.save(product);

    // Increment subscription product count
    await this.subscriptionService.incrementProductCount(input.creatorId);

    return Result.ok({
      published: true,
      publishedAt: product.publishedAt!,
      limitWarning: limitResult.status === 'WARNING' ? limitResult.message : undefined,
    });
  }
}
