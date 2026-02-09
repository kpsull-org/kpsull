/**
 * Specification for filtering flagged content by moderation status.
 */

import { CompositeSpecification } from '@/shared/domain/specifications/composite-specification';
import type { ModerationStatusValue } from '../value-objects/moderation-status.vo';

interface FlaggedContentLike {
  status: ModerationStatusValue;
}

export class FlaggedContentStatusSpecification extends CompositeSpecification<FlaggedContentLike> {
  constructor(private readonly targetStatus: ModerationStatusValue) {
    super();
  }

  isSatisfiedBy(entity: FlaggedContentLike): boolean {
    return entity.status === this.targetStatus;
  }

  toPrismaWhere(): Record<string, unknown> {
    return { status: this.targetStatus };
  }
}
