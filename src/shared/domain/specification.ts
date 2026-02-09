/**
 * Specification Pattern - Composable business rules for filtering/validation.
 *
 * Supports both domain-level validation (isSatisfiedBy) and
 * infrastructure-level query building (toPrismaWhere).
 */
export interface Specification<T> {
  isSatisfiedBy(entity: T): boolean;
  and(other: Specification<T>): Specification<T>;
  or(other: Specification<T>): Specification<T>;
  not(): Specification<T>;
  toPrismaWhere(): Record<string, unknown>;
}
