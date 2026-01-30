import { ValueObject, Result } from '@/shared/domain';

export type PageStatusValue = 'DRAFT' | 'PUBLISHED';

interface PageStatusProps {
  value: PageStatusValue;
}

/**
 * PageStatus Value Object
 *
 * Represents the publication status of a creator page.
 */
export class PageStatus extends ValueObject<PageStatusProps> {
  private constructor(props: PageStatusProps) {
    super(props);
  }

  get value(): PageStatusValue {
    return this.props.value;
  }

  get isDraft(): boolean {
    return this.value === 'DRAFT';
  }

  get isPublished(): boolean {
    return this.value === 'PUBLISHED';
  }

  static draft(): PageStatus {
    return new PageStatus({ value: 'DRAFT' });
  }

  static published(): PageStatus {
    return new PageStatus({ value: 'PUBLISHED' });
  }

  static fromString(value: string): Result<PageStatus> {
    const validStatuses: PageStatusValue[] = ['DRAFT', 'PUBLISHED'];

    if (!validStatuses.includes(value as PageStatusValue)) {
      return Result.fail(`Statut de page invalide: ${value}`);
    }

    return Result.ok(new PageStatus({ value: value as PageStatusValue }));
  }
}
