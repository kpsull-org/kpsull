'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth/auth';
import { PrismaCreatorOnboardingRepository } from '@/modules/creators/infrastructure/repositories/prisma-creator-onboarding.repository';
import { SubmitProfessionalInfoUseCase } from '@/modules/creators/application/use-cases/submit-professional-info.use-case';
import { VerifySiretUseCase } from '@/modules/creators/application/use-cases/verify-siret.use-case';
import { MockSiretService } from '@/modules/creators/infrastructure/services/mock-siret.service';

const creatorOnboardingRepository = new PrismaCreatorOnboardingRepository();
const submitProfessionalInfoUseCase = new SubmitProfessionalInfoUseCase(
  creatorOnboardingRepository
);

// Use mock service for development - switch to InseeSiretService in production
const siretService = new MockSiretService();
const verifySiretUseCase = new VerifySiretUseCase(
  creatorOnboardingRepository,
  siretService
);

// ============================================
// Types
// ============================================

interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

interface SiretVerificationResult extends ActionResult {
  status?: 'VERIFIED' | 'PENDING_MANUAL' | 'INVALID' | 'ERROR';
  companyInfo?: {
    companyName: string;
    legalForm?: string;
    address?: {
      street: string;
      postalCode: string;
      city: string;
    };
    activityCode?: string;
    activityLabel?: string;
    creationDate?: string;
  };
  message?: string;
}

export interface ProfessionalInfoInput {
  brandName: string;
  siret: string;
  street: string;
  city: string;
  postalCode: string;
}

/**
 * Submit professional info (Step 1)
 *
 * Uses the SubmitProfessionalInfoUseCase for domain validation.
 */
export async function submitProfessionalInfo(
  input: ProfessionalInfoInput
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Execute use case with domain validation
  const result = await submitProfessionalInfoUseCase.execute({
    userId: session.user.id,
    brandName: input.brandName,
    siret: input.siret,
    street: input.street,
    city: input.city,
    postalCode: input.postalCode,
  });

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  revalidatePath('/onboarding/creator');

  return { success: true };
}

/**
 * Verify SIRET (Step 2)
 *
 * Uses the VerifySiretUseCase to verify SIRET via INSEE API (or mock in dev).
 * Returns company information on success.
 */
export async function verifySiret(): Promise<SiretVerificationResult> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const result = await verifySiretUseCase.execute({
    userId: session.user.id,
  });

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  const output = result.value;

  revalidatePath('/onboarding/creator');

  return {
    success: true,
    status: output.status,
    message: output.message,
    companyInfo: output.companyInfo
      ? {
          companyName: output.companyInfo.companyName,
          legalForm: output.companyInfo.legalForm,
          address: output.companyInfo.address,
          activityCode: output.companyInfo.activityCode,
          activityLabel: output.companyInfo.activityLabel,
          creationDate: output.companyInfo.creationDate?.toLocaleDateString('fr-FR'),
        }
      : undefined,
  };
}

/**
 * Complete Stripe onboarding (Step 3)
 *
 * Note: In a real implementation, this would handle the Stripe OAuth callback.
 */
export async function completeStripeOnboarding(
  stripeAccountId: string
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Get onboarding
  const onboarding = await creatorOnboardingRepository.findByUserId(
    session.user.id
  );

  if (!onboarding) {
    return { success: false, error: 'Onboarding non trouvé' };
  }

  // Complete Stripe onboarding
  const result = onboarding.completeStripeOnboarding(stripeAccountId);

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  // Save
  await creatorOnboardingRepository.save(onboarding);

  revalidatePath('/onboarding/creator');

  return { success: true };
}
