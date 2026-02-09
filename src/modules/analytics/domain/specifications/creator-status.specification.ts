/**
 * Specification for filtering creators by status (ACTIVE or SUSPENDED).
 * Status is derived from CreatorSuspension records:
 * - SUSPENDED: has an un-reactivated suspension record
 * - ACTIVE: no un-reactivated suspension record
 */

import { CompositeSpecification } from '@/shared/domain/specifications/composite-specification';
import type { CreatorLike } from './creator-like.type';

export class CreatorStatusSpecification extends CompositeSpecification<CreatorLike> {
  constructor(private readonly targetStatus: 'ACTIVE' | 'SUSPENDED') {
    super();
  }

  isSatisfiedBy(entity: CreatorLike): boolean {
    return entity.status === this.targetStatus;
  }

  toPrismaWhere(): Record<string, unknown> {
    if (this.targetStatus === 'SUSPENDED') {
      return {
        suspensions: {
          some: { reactivatedAt: null },
        },
      };
    }
    return {
      suspensions: {
        none: { reactivatedAt: null },
      },
    };
  }
}
