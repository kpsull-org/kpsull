// Ports
export type { ProjectRepository } from './ports/project.repository.interface';
export type { ProductRepository } from './ports/product.repository.interface';
export type { VariantRepository } from './ports/variant.repository.interface';

// Use Cases - Projects
export {
  CreateProjectUseCase,
  type CreateProjectInput,
  type CreateProjectOutput,
} from './use-cases/projects/create-project.use-case';

export {
  UpdateProjectUseCase,
  type UpdateProjectInput,
  type UpdateProjectOutput,
} from './use-cases/projects/update-project.use-case';

export {
  DeleteProjectUseCase,
  type DeleteProjectInput,
  type DeleteProjectOutput,
} from './use-cases/projects/delete-project.use-case';

export {
  ListProjectsUseCase,
  type ListProjectsInput,
  type ListProjectsOutput,
  type ProjectListItem,
} from './use-cases/projects/list-projects.use-case';

// Use Cases - Products
export {
  CreateProductUseCase,
  type CreateProductInput,
  type CreateProductOutput,
} from './use-cases/products/create-product.use-case';

export {
  PublishProductUseCase,
  type PublishProductInput,
  type PublishProductOutput,
} from './use-cases/products/publish-product.use-case';

export {
  UnpublishProductUseCase,
  type UnpublishProductInput,
  type UnpublishProductOutput,
} from './use-cases/products/unpublish-product.use-case';

export {
  ListProductsUseCase,
  type ListProductsInput,
  type ListProductsOutput,
  type ProductListItem,
  type ProductListRepository,
} from './use-cases/products/list-products.use-case';

// Use Cases - Variants
export {
  CreateVariantUseCase,
  type CreateVariantInput,
  type CreateVariantOutput,
} from './use-cases/variants/create-variant.use-case';

export {
  UpdateVariantUseCase,
  type UpdateVariantInput,
  type UpdateVariantOutput,
} from './use-cases/variants/update-variant.use-case';

export {
  DeleteVariantUseCase,
  type DeleteVariantInput,
  type DeleteVariantOutput,
} from './use-cases/variants/delete-variant.use-case';

export {
  ListVariantsUseCase,
  type ListVariantsInput,
  type ListVariantsOutput,
  type VariantOutput,
} from './use-cases/variants/list-variants.use-case';

// Services
export type {
  SubscriptionService,
  LimitCheckResult,
  LimitStatus,
} from './ports/subscription.service.interface';
