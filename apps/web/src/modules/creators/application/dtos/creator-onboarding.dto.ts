import { OnboardingStepType } from '../../domain/value-objects/onboarding-step.vo';

/**
 * DTO for CreatorOnboarding
 *
 * Used to transfer creator onboarding data between layers.
 */
export interface CreatorOnboardingDTO {
  id: string;
  userId: string;
  currentStep: OnboardingStepType;
  stepNumber: number;
  professionalInfoCompleted: boolean;
  siretVerified: boolean;
  stripeOnboarded: boolean;
  brandName: string | null;
  siret: string | null;
  professionalAddress: string | null;
  stripeAccountId: string | null;
  startedAt: Date;
  completedAt: Date | null;
  isFullyCompleted: boolean;
}
