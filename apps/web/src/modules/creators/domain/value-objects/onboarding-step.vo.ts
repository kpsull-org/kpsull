import { ValueObject } from '@/shared/domain/value-object.base';
import { Result } from '@/shared/domain/result';

/**
 * Valid onboarding step types
 */
export type OnboardingStepType =
  | 'PROFESSIONAL_INFO'
  | 'SIRET_VERIFICATION'
  | 'STRIPE_CONNECT'
  | 'COMPLETED';

const VALID_STEPS: OnboardingStepType[] = [
  'PROFESSIONAL_INFO',
  'SIRET_VERIFICATION',
  'STRIPE_CONNECT',
  'COMPLETED',
];

const STEP_NUMBERS: Record<OnboardingStepType, number> = {
  PROFESSIONAL_INFO: 1,
  SIRET_VERIFICATION: 2,
  STRIPE_CONNECT: 3,
  COMPLETED: 4,
};

interface OnboardingStepProps {
  value: OnboardingStepType;
}

/**
 * OnboardingStep Value Object
 *
 * Represents a step in the creator onboarding process.
 */
export class OnboardingStep extends ValueObject<OnboardingStepProps> {
  private constructor(props: OnboardingStepProps) {
    super(props);
  }

  /**
   * Creates a new OnboardingStep
   */
  static create(step: OnboardingStepType): Result<OnboardingStep> {
    if (!VALID_STEPS.includes(step)) {
      return Result.fail(
        `Invalid onboarding step: ${step}. Valid steps are: ${VALID_STEPS.join(', ')}`
      );
    }

    return Result.ok(new OnboardingStep({ value: step }));
  }

  /**
   * Returns the default onboarding step (PROFESSIONAL_INFO)
   */
  static default(): OnboardingStep {
    return new OnboardingStep({ value: 'PROFESSIONAL_INFO' });
  }

  /**
   * The step value
   */
  get value(): OnboardingStepType {
    return this.props.value;
  }

  /**
   * The step number (1-4)
   */
  get stepNumber(): number {
    return STEP_NUMBERS[this.props.value];
  }

  /**
   * Whether this is the professional info step
   */
  get isProfessionalInfo(): boolean {
    return this.props.value === 'PROFESSIONAL_INFO';
  }

  /**
   * Whether this is the SIRET verification step
   */
  get isSiretVerification(): boolean {
    return this.props.value === 'SIRET_VERIFICATION';
  }

  /**
   * Whether this is the Stripe Connect step
   */
  get isStripeConnect(): boolean {
    return this.props.value === 'STRIPE_CONNECT';
  }

  /**
   * Whether this is the completed step
   */
  get isCompleted(): boolean {
    return this.props.value === 'COMPLETED';
  }
}
