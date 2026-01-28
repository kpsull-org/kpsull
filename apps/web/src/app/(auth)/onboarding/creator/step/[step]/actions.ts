'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth/auth';
import { PrismaCreatorOnboardingRepository } from '@/modules/creators/infrastructure/repositories/prisma-creator-onboarding.repository';
import { SubmitProfessionalInfoUseCase } from '@/modules/creators/application/use-cases/submit-professional-info.use-case';
import { VerifySiretUseCase } from '@/modules/creators/application/use-cases/verify-siret.use-case';
import { CreateStripeAccountUseCase } from '@/modules/creators/application/use-cases/create-stripe-account.use-case';
import { MockSiretService } from '@/modules/creators/infrastructure/services/mock-siret.service';
import { MockStripeConnectService } from '@/modules/creators/infrastructure/services/mock-stripe-connect.service';

const creatorOnboardingRepository = new PrismaCreatorOnboardingRepository();
const submitProfessionalInfoUseCase = new SubmitProfessionalInfoUseCase(
  creatorOnboardingRepository
);

// Use mock services for development - switch to real services in production
const siretService = new MockSiretService();
const verifySiretUseCase = new VerifySiretUseCase(
  creatorOnboardingRepository,
  siretService
);

const stripeService = new MockStripeConnectService();
const createStripeAccountUseCase = new CreateStripeAccountUseCase(
  creatorOnboardingRepository,
  stripeService
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

interface CreateStripeAccountResult extends ActionResult {
  stripeAccountId?: string;
  onboardingUrl?: string;
}

/**
 * Create or resume Stripe Connect account (Step 3)
 *
 * Creates a new Stripe Connect Express account or generates a new account link
 * if one already exists.
 */
export async function createStripeAccount(): Promise<CreateStripeAccountResult> {
  const session = await auth();

  if (!session?.user?.id || !session?.user?.email) {
    redirect('/login');
  }

  const result = await createStripeAccountUseCase.execute({
    userId: session.user.id,
    email: session.user.email,
  });

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  revalidatePath('/onboarding/creator');

  return {
    success: true,
    stripeAccountId: result.value!.stripeAccountId,
    onboardingUrl: result.value!.onboardingUrl,
  };
}

/**
 * Check Stripe account status and complete onboarding if ready
 *
 * Called when user returns from Stripe onboarding flow.
 */
export async function checkStripeStatus(): Promise<ActionResult & { isOnboarded?: boolean }> {
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

  if (!onboarding.stripeAccountId) {
    return { success: false, error: 'Aucun compte Stripe associé' };
  }

  // Check status with Stripe
  const statusResult = await stripeService.checkAccountStatus(
    onboarding.stripeAccountId
  );

  if (statusResult.isFailure) {
    return { success: false, error: statusResult.error! };
  }

  const status = statusResult.value!;

  if (status.isFullyOnboarded && !onboarding.stripeOnboarded) {
    // Complete the onboarding
    const completeResult = onboarding.completeStripeOnboarding(
      onboarding.stripeAccountId
    );

    if (completeResult.isFailure) {
      return { success: false, error: completeResult.error! };
    }

    await creatorOnboardingRepository.save(onboarding);
    revalidatePath('/onboarding/creator');
  }

  return {
    success: true,
    isOnboarded: status.isFullyOnboarded,
  };
}
