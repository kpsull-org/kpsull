/**
 * Base abstract class for composable Specifications.
 * Provides AND, OR, NOT combinators.
 */

import type { Specification } from '../specification';

export abstract class CompositeSpecification<T> implements Specification<T> {
  abstract isSatisfiedBy(entity: T): boolean;
  abstract toPrismaWhere(): Record<string, unknown>;

  and(other: Specification<T>): Specification<T> {
    return new AndSpecification(this, other);
  }

  or(other: Specification<T>): Specification<T> {
    return new OrSpecification(this, other);
  }

  not(): Specification<T> {
    return new NotSpecification(this);
  }
}

class AndSpecification<T> extends CompositeSpecification<T> {
  constructor(
    private readonly left: Specification<T>,
    private readonly right: Specification<T>
  ) {
    super();
  }

  isSatisfiedBy(entity: T): boolean {
    return this.left.isSatisfiedBy(entity) && this.right.isSatisfiedBy(entity);
  }

  toPrismaWhere(): Record<string, unknown> {
    return { AND: [this.left.toPrismaWhere(), this.right.toPrismaWhere()] };
  }
}

class OrSpecification<T> extends CompositeSpecification<T> {
  constructor(
    private readonly left: Specification<T>,
    private readonly right: Specification<T>
  ) {
    super();
  }

  isSatisfiedBy(entity: T): boolean {
    return this.left.isSatisfiedBy(entity) || this.right.isSatisfiedBy(entity);
  }

  toPrismaWhere(): Record<string, unknown> {
    return { OR: [this.left.toPrismaWhere(), this.right.toPrismaWhere()] };
  }
}

class NotSpecification<T> extends CompositeSpecification<T> {
  constructor(private readonly spec: Specification<T>) {
    super();
  }

  isSatisfiedBy(entity: T): boolean {
    return !this.spec.isSatisfiedBy(entity);
  }

  toPrismaWhere(): Record<string, unknown> {
    return { NOT: this.spec.toPrismaWhere() };
  }
}
