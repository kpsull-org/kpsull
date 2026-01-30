import { ValueObject, Result } from '@/shared/domain';

export type PlanType = 'ESSENTIEL' | 'STUDIO' | 'ATELIER';

interface PlanProps {
  value: PlanType;
}

const VALID_PLANS: PlanType[] = ['ESSENTIEL', 'STUDIO', 'ATELIER'];

/**
 * Plan Value Object
 *
 * Represents a subscription plan type for Kpsull creators.
 * - ESSENTIEL: 29€/mois ou 290€/an - Commission 5% - 10 produits
 * - STUDIO: 79€/mois ou 790€/an - Commission 4% - 20 produits
 * - ATELIER: 95€/mois ou 950€/an - Commission 3% - Illimité - 14j essai gratuit
 */
export class Plan extends ValueObject<PlanProps> {
  private constructor(props: PlanProps) {
    super(props);
  }

  get value(): PlanType {
    return this.props.value;
  }

  get isEssentiel(): boolean {
    return this.props.value === 'ESSENTIEL';
  }

  get isStudio(): boolean {
    return this.props.value === 'STUDIO';
  }

  get isAtelier(): boolean {
    return this.props.value === 'ATELIER';
  }

  static create(value: PlanType): Result<Plan> {
    if (!VALID_PLANS.includes(value)) {
      return Result.fail('Plan invalide');
    }

    return Result.ok(new Plan({ value }));
  }

  static essentiel(): Plan {
    return new Plan({ value: 'ESSENTIEL' });
  }

  static studio(): Plan {
    return new Plan({ value: 'STUDIO' });
  }

  static atelier(): Plan {
    return new Plan({ value: 'ATELIER' });
  }
}
