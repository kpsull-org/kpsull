import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { SkuRepository } from '../../ports/sku.repository.interface';
import { ProductRepository } from '../../ports/product.repository.interface';
import { ProductSku } from '../../../domain/entities/product-sku.entity';
import { SkuOutput } from './list-skus.use-case';

export interface UpsertSkuInput {
  productId: string;
  variantId?: string;
  size?: string;
  stock: number;
}

export class UpsertSkuUseCase implements UseCase<UpsertSkuInput, SkuOutput> {
  constructor(
    private readonly skuRepository: SkuRepository,
    private readonly productRepository: ProductRepository
  ) {}

  async execute(input: UpsertSkuInput): Promise<Result<SkuOutput>> {
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      return Result.fail("Le produit n'existe pas");
    }

    if (!input.variantId) {
      return Result.fail('Le variantId est requis');
    }

    const existingSkus = await this.skuRepository.findByProductId(input.productId);

    const existing = existingSkus.find(
      (s) => s.variantId === input.variantId && s.size === input.size
    );

    let skuEntity: ProductSku;

    if (existing) {
      const stockResult = existing.updateStock(input.stock);
      if (stockResult.isFailure) return Result.fail(stockResult.error!);
      skuEntity = existing;
    } else {
      const createResult = ProductSku.create({
        productId: input.productId,
        variantId: input.variantId,
        size: input.size,
        stock: input.stock,
      });
      if (createResult.isFailure) return Result.fail(createResult.error!);
      skuEntity = createResult.value;
    }

    await this.skuRepository.upsert(skuEntity);

    return Result.ok({
      id: skuEntity.idString,
      productId: skuEntity.productId,
      variantId: skuEntity.variantId,
      size: skuEntity.size,
      stock: skuEntity.stock,
    });
  }
}
