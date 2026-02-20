import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { SkuRepository } from '../../ports/sku.repository.interface';
import { ProductRepository } from '../../ports/product.repository.interface';

export interface ListSkusInput {
  productId: string;
}

export interface SkuOutput {
  id: string;
  productId: string;
  variantId?: string;
  size?: string;
  stock: number;
}

export interface ListSkusOutput {
  skus: SkuOutput[];
}

export class ListSkusUseCase implements UseCase<ListSkusInput, ListSkusOutput> {
  constructor(
    private readonly skuRepository: SkuRepository,
    private readonly productRepository: ProductRepository
  ) {}

  async execute(input: ListSkusInput): Promise<Result<ListSkusOutput>> {
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      return Result.fail("Le produit n'existe pas");
    }

    const skus = await this.skuRepository.findByProductId(input.productId);

    const skuOutputs: SkuOutput[] = skus.map((s) => ({
      id: s.idString,
      productId: s.productId,
      variantId: s.variantId,
      size: s.size,
      stock: s.stock,
    }));

    return Result.ok({ skus: skuOutputs });
  }
}
