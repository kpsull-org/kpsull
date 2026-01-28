'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth/auth';
import { PrismaCreatorOnboardingRepository } from '@/modules/creators/infrastructure/repositories/prisma-creator-onboarding.repository';

const creatorOnboardingRepository = new PrismaCreatorOnboardingRepository();

// ============================================
// Schemas
// ============================================

const professionalInfoSchema = z.object({
  brandName: z.string().min(1, 'Le nom de marque est requis').max(100),
  siret: z
    .string()
    .length(14, 'Le SIRET doit contenir exactement 14 chiffres')
    .regex(/^\d{14}$/, 'Le SIRET ne doit contenir que des chiffres'),
  professionalAddress: z.string().min(1, "L'adresse est requise").max(500),
});

// ============================================
// Actions
// ============================================

interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Submit professional info (Step 1)
 */
export async function submitProfessionalInfo(input: {
  brandName: string;
  siret: string;
  professionalAddress: string;
}): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Validate input
  const validationResult = professionalInfoSchema.safeParse(input);
  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return { success: false, error: firstError?.message ?? 'Données invalides' };
  }

  const { brandName, siret, professionalAddress } = validationResult.data;

  // Get onboarding
  const onboarding = await creatorOnboardingRepository.findByUserId(
    session.user.id
  );

  if (!onboarding) {
    return { success: false, error: 'Onboarding non trouvé' };
  }

  // Complete professional info
  const result = onboarding.completeProfessionalInfo({
    brandName,
    siret,
    professionalAddress,
  });

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  // Save
  await creatorOnboardingRepository.save(onboarding);

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
