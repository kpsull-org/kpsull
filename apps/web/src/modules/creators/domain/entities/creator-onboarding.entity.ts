import { Entity } from '@/shared/domain/entity.base';
import { UniqueId } from '@/shared/domain/unique-id.vo';
import { Result } from '@/shared/domain/result';
import { OnboardingStep, OnboardingStepType } from '../value-objects/onboarding-step.vo';

/**
 * Props required to create a new CreatorOnboarding
 */
export interface CreateCreatorOnboardingProps {
  userId: string;
}

/**
 * Props required to reconstitute a CreatorOnboarding from persistence
 */
export interface ReconstituteCreatorOnboardingProps {
  id: string;
  userId: string;
  currentStep: OnboardingStepType;
  professionalInfoCompleted: boolean;
  siretVerified: boolean;
  stripeOnboarded: boolean;
  brandName: string | null;
  siret: string | null;
  professionalAddress: string | null;
  stripeAccountId: string | null;
  startedAt: Date;
  completedAt: Date | null;
  updatedAt: Date;
}

/**
 * Props for completing professional info step
 */
export interface CompleteProfessionalInfoProps {
  brandName: string;
  siret: string;
  professionalAddress: string;
}

/**
 * Internal props for CreatorOnboarding entity
 */
interface CreatorOnboardingProps {
  userId: string;
  currentStep: OnboardingStep;
  professionalInfoCompleted: boolean;
  siretVerified: boolean;
  stripeOnboarded: boolean;
  brandName: string | null;
  siret: string | null;
  professionalAddress: string | null;
  stripeAccountId: string | null;
  startedAt: Date;
  completedAt: Date | null;
  updatedAt: Date;
}

/**
 * CreatorOnboarding Entity
 *
 * Tracks the progress of a user's creator onboarding process.
 * The onboarding has 3 steps:
 * 1. Professional Info
 * 2. SIRET Verification
 * 3. Stripe Connect
 */
export class CreatorOnboarding extends Entity<CreatorOnboardingProps> {
  private constructor(props: CreatorOnboardingProps, id?: UniqueId) {
    super(props, id);
  }

  /**
   * Creates a new CreatorOnboarding entity
   */
  static create(
    props: CreateCreatorOnboardingProps,
    id?: UniqueId
  ): Result<CreatorOnboarding> {
    if (!props.userId || props.userId.trim() === '') {
      return Result.fail('User ID is required');
    }

    const now = new Date();

    const onboarding = new CreatorOnboarding(
      {
        userId: props.userId,
        currentStep: OnboardingStep.default(),
        professionalInfoCompleted: false,
        siretVerified: false,
        stripeOnboarded: false,
        brandName: null,
        siret: null,
        professionalAddress: null,
        stripeAccountId: null,
        startedAt: now,
        completedAt: null,
        updatedAt: now,
      },
      id
    );

    return Result.ok(onboarding);
  }

  /**
   * Reconstitutes a CreatorOnboarding entity from persistence data
   */
  static reconstitute(
    props: ReconstituteCreatorOnboardingProps
  ): Result<CreatorOnboarding> {
    const stepResult = OnboardingStep.create(props.currentStep);
    if (stepResult.isFailure) {
      return Result.fail(stepResult.error!);
    }

    const id = UniqueId.fromString(props.id);

    const onboarding = new CreatorOnboarding(
      {
        userId: props.userId,
        currentStep: stepResult.value,
        professionalInfoCompleted: props.professionalInfoCompleted,
        siretVerified: props.siretVerified,
        stripeOnboarded: props.stripeOnboarded,
        brandName: props.brandName,
        siret: props.siret,
        professionalAddress: props.professionalAddress,
        stripeAccountId: props.stripeAccountId,
        startedAt: props.startedAt,
        completedAt: props.completedAt,
        updatedAt: props.updatedAt,
      },
      id
    );

    return Result.ok(onboarding);
  }

  // Getters
  get userId(): string {
    return this.props.userId;
  }

  get currentStep(): OnboardingStep {
    return this.props.currentStep;
  }

  get professionalInfoCompleted(): boolean {
    return this.props.professionalInfoCompleted;
  }

  get siretVerified(): boolean {
    return this.props.siretVerified;
  }

  get stripeOnboarded(): boolean {
    return this.props.stripeOnboarded;
  }

  get brandName(): string | null {
    return this.props.brandName;
  }

  get siret(): string | null {
    return this.props.siret;
  }

  get professionalAddress(): string | null {
    return this.props.professionalAddress;
  }

  get stripeAccountId(): string | null {
    return this.props.stripeAccountId;
  }

  get startedAt(): Date {
    return this.props.startedAt;
  }

  get completedAt(): Date | null {
    return this.props.completedAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isFullyCompleted(): boolean {
    return (
      this.props.professionalInfoCompleted &&
      this.props.siretVerified &&
      this.props.stripeOnboarded &&
      this.props.currentStep.isCompleted
    );
  }

  /**
   * Completes the professional info step
   */
  completeProfessionalInfo(props: CompleteProfessionalInfoProps): Result<void> {
    if (!props.brandName || props.brandName.trim() === '') {
      return Result.fail('Brand name is required');
    }

    if (!props.siret || props.siret.trim() === '') {
      return Result.fail('SIRET is required');
    }

    this.props.brandName = props.brandName;
    this.props.siret = props.siret;
    this.props.professionalAddress = props.professionalAddress;
    this.props.professionalInfoCompleted = true;

    // Advance to next step
    const nextStepResult = OnboardingStep.create('SIRET_VERIFICATION');
    if (nextStepResult.isSuccess) {
      this.props.currentStep = nextStepResult.value;
    }

    this.props.updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * Verifies the SIRET
   */
  verifySiret(): Result<void> {
    if (!this.props.professionalInfoCompleted) {
      return Result.fail('Professional info must be completed first');
    }

    this.props.siretVerified = true;

    // Advance to next step
    const nextStepResult = OnboardingStep.create('STRIPE_CONNECT');
    if (nextStepResult.isSuccess) {
      this.props.currentStep = nextStepResult.value;
    }

    this.props.updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * Completes the Stripe onboarding
   */
  completeStripeOnboarding(stripeAccountId: string): Result<void> {
    if (!this.props.siretVerified) {
      return Result.fail('SIRET must be verified first');
    }

    if (!stripeAccountId || stripeAccountId.trim() === '') {
      return Result.fail('Stripe account ID is required');
    }

    this.props.stripeAccountId = stripeAccountId;
    this.props.stripeOnboarded = true;

    // Mark as completed
    const completedStepResult = OnboardingStep.create('COMPLETED');
    if (completedStepResult.isSuccess) {
      this.props.currentStep = completedStepResult.value;
    }

    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();

    return Result.ok(undefined);
  }
}
