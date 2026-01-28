'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth/auth';
import { PrismaCreatorOnboardingRepository } from '@/modules/creators/infrastructure/repositories/prisma-creator-onboarding.repository';
import { SubmitProfessionalInfoUseCase } from '@/modules/creators/application/use-cases/submit-professional-info.use-case';

const creatorOnboardingRepository = new PrismaCreatorOnboardingRepository();
const submitProfessionalInfoUseCase = new SubmitProfessionalInfoUseCase(
  creatorOnboardingRepository
);

// ============================================
// Types
// ============================================

interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
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
 * Note: In a real implementation, this would call the INSEE API.
 * For now, we simulate verification success.
 */
export async function verifySiret(): Promise<ActionResult> {
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

  // TODO: Call INSEE API to verify SIRET (Story 2-3)
  // For now, we simulate successful verification

  // Verify SIRET
  const result = onboarding.verifySiret();

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  // Save
  await creatorOnboardingRepository.save(onboarding);

  revalidatePath('/onboarding/creator');

  return { success: true };
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
