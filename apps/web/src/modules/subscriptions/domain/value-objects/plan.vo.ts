import { ValueObject, Result } from '@/shared/domain';

export type PlanType = 'FREE' | 'PRO';

interface PlanProps {
  value: PlanType;
}

const VALID_PLANS: PlanType[] = ['FREE', 'PRO'];

/**
 * Plan Value Object
 *
 * Represents a subscription plan type (FREE or PRO).
 */
export class Plan extends ValueObject<PlanProps> {
  private constructor(props: PlanProps) {
    super(props);
  }

  get value(): PlanType {
    return this.props.value;
  }

  get isFree(): boolean {
    return this.props.value === 'FREE';
  }

  get isPro(): boolean {
    return this.props.value === 'PRO';
  }

  static create(value: PlanType): Result<Plan> {
    if (!VALID_PLANS.includes(value)) {
      return Result.fail('Plan invalide');
    }

    return Result.ok(new Plan({ value }));
  }

  static free(): Plan {
    return new Plan({ value: 'FREE' });
  }

  static pro(): Plan {
    return new Plan({ value: 'PRO' });
  }
}
