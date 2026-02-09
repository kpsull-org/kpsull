/**
 * Specification for searching creators by name or email (case-insensitive).
 */

import { CompositeSpecification } from '@/shared/domain/specifications/composite-specification';
import type { CreatorLike } from './creator-like.type';

export class CreatorSearchSpecification extends CompositeSpecification<CreatorLike> {
  private readonly lowerQuery: string;

  constructor(private readonly query: string) {
    super();
    this.lowerQuery = query.toLowerCase();
  }

  isSatisfiedBy(entity: CreatorLike): boolean {
    return (
      entity.name.toLowerCase().includes(this.lowerQuery) ||
      entity.email.toLowerCase().includes(this.lowerQuery)
    );
  }

  toPrismaWhere(): Record<string, unknown> {
    return {
      OR: [
        { name: { contains: this.query, mode: 'insensitive' } },
        { email: { contains: this.query, mode: 'insensitive' } },
      ],
    };
  }
}
