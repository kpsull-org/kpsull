import { Entity, UniqueId, Result } from '@/shared/domain';
import { Money } from '../value-objects/money.vo';
import { ProductStatus, ProductStatusValue } from '../value-objects/product-status.vo';

interface ProductProps {
  creatorId: string;
  projectId?: string;
  name: string;
  description?: string;
  price: Money;
  status: ProductStatus;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateProductProps {
  creatorId: string;
  projectId?: string;
  name: string;
  description?: string;
  price: Money;
}

interface ReconstituteProductProps {
  id: string;
  creatorId: string;
  projectId?: string;
  name: string;
  description?: string;
  priceAmount: number;
  priceCurrency: string;
  status: ProductStatusValue;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product Entity
 *
 * Represents a product in a creator's catalog.
 */
export class Product extends Entity<ProductProps> {
  private constructor(props: ProductProps, id?: UniqueId) {
    super(props, id);
  }

  // Get ID as string
  get idString(): string {
    return this._id.toString();
  }

  // Getters
  get creatorId(): string {
    return this.props.creatorId;
  }

  get projectId(): string | undefined {
    return this.props.projectId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get price(): Money {
    return this.props.price;
  }

  get status(): ProductStatus {
    return this.props.status;
  }

  get publishedAt(): Date | undefined {
    return this.props.publishedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Computed properties
  get isDraft(): boolean {
    return this.props.status.isDraft;
  }

  get isPublished(): boolean {
    return this.props.status.isPublished;
  }

  get isArchived(): boolean {
    return this.props.status.isArchived;
  }

  // Methods
  publish(): Result<void> {
    if (this.isPublished) {
      return Result.fail('Le produit est déjà publié');
    }

    this.props.status = ProductStatus.published();
    this.props.publishedAt = new Date();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  unpublish(): Result<void> {
    if (this.isDraft) {
      return Result.fail('Le produit est déjà en brouillon');
    }

    this.props.status = ProductStatus.draft();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  archive(): Result<void> {
    if (this.isArchived) {
      return Result.fail('Le produit est déjà archivé');
    }

    this.props.status = ProductStatus.archived();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  updateName(name: string): Result<void> {
    if (!name.trim()) {
      return Result.fail('Le nom du produit est requis');
    }

    if (name.length > 200) {
      return Result.fail('Le nom ne peut pas dépasser 200 caractères');
    }

    this.props.name = name.trim();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  updateDescription(description: string): void {
    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  updatePrice(price: Money): void {
    this.props.price = price;
    this.props.updatedAt = new Date();
  }

  assignToProject(projectId?: string): void {
    this.props.projectId = projectId;
    this.props.updatedAt = new Date();
  }

  // Factory methods
  static create(props: CreateProductProps): Result<Product> {
    if (!props.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    if (!props.name?.trim()) {
      return Result.fail('Le nom du produit est requis');
    }

    if (props.name.length > 200) {
      return Result.fail('Le nom ne peut pas dépasser 200 caractères');
    }

    const now = new Date();

    return Result.ok(
      new Product({
        creatorId: props.creatorId.trim(),
        projectId: props.projectId,
        name: props.name.trim(),
        description: props.description,
        price: props.price,
        status: ProductStatus.draft(),
        publishedAt: undefined,
        createdAt: now,
        updatedAt: now,
      })
    );
  }

  static reconstitute(props: ReconstituteProductProps): Result<Product> {
    const statusResult = ProductStatus.fromString(props.status);
    if (statusResult.isFailure) {
      return Result.fail(statusResult.error!);
    }

    const price = Money.fromCents(props.priceAmount, props.priceCurrency);

    return Result.ok(
      new Product(
        {
          creatorId: props.creatorId,
          projectId: props.projectId,
          name: props.name,
          description: props.description,
          price,
          status: statusResult.value!,
          publishedAt: props.publishedAt,
          createdAt: props.createdAt,
          updatedAt: props.updatedAt,
        },
        UniqueId.fromString(props.id)
      )
    );
  }
}
