import { Entity, UniqueId, Result } from '@/shared/domain';

interface ProjectProps {
  creatorId: string;
  name: string;
  description?: string;
  coverImage?: string;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateProjectProps {
  creatorId: string;
  name: string;
  description?: string;
  coverImage?: string;
}

interface ReconstituteProjectProps {
  id: string;
  creatorId: string;
  name: string;
  description?: string;
  coverImage?: string;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project Entity
 *
 * Represents a collection of products for a creator.
 * Projects help organize and present products in a structured way.
 */
export class Project extends Entity<ProjectProps> {
  private constructor(props: ProjectProps, id?: UniqueId) {
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

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get coverImage(): string | undefined {
    return this.props.coverImage;
  }

  get productCount(): number {
    return this.props.productCount;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Methods
  updateName(name: string): Result<void> {
    if (!name.trim()) {
      return Result.fail('Le nom du projet est requis');
    }

    if (name.length > 100) {
      return Result.fail('Le nom ne peut pas dépasser 100 caractères');
    }

    this.props.name = name;
    this.props.updatedAt = new Date();
    return Result.ok();
  }

  updateDescription(description: string): void {
    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  updateCoverImage(coverImage: string): void {
    this.props.coverImage = coverImage;
    this.props.updatedAt = new Date();
  }

  incrementProductCount(): void {
    this.props.productCount += 1;
    this.props.updatedAt = new Date();
  }

  decrementProductCount(): void {
    if (this.props.productCount > 0) {
      this.props.productCount -= 1;
      this.props.updatedAt = new Date();
    }
  }

  // Factory methods
  static create(props: CreateProjectProps): Result<Project> {
    if (!props.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    if (!props.name?.trim()) {
      return Result.fail('Le nom du projet est requis');
    }

    if (props.name.length > 100) {
      return Result.fail('Le nom ne peut pas dépasser 100 caractères');
    }

    const now = new Date();

    return Result.ok(
      new Project({
        creatorId: props.creatorId.trim(),
        name: props.name.trim(),
        description: props.description,
        coverImage: props.coverImage,
        productCount: 0,
        createdAt: now,
        updatedAt: now,
      })
    );
  }

  static reconstitute(props: ReconstituteProjectProps): Result<Project> {
    return Result.ok(
      new Project(
        {
          creatorId: props.creatorId,
          name: props.name,
          description: props.description,
          coverImage: props.coverImage,
          productCount: props.productCount,
          createdAt: props.createdAt,
          updatedAt: props.updatedAt,
        },
        UniqueId.fromString(props.id)
      )
    );
  }
}
