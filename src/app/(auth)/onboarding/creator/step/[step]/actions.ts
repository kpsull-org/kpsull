'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth/auth';
import { PrismaCreatorOnboardingRepository } from '@/modules/creators/infrastructure/repositories/prisma-creator-onboarding.repository';
import { SubmitProfessionalInfoUseCase } from '@/modules/creators/application/use-cases/submit-professional-info.use-case';
import { VerifySiretUseCase } from '@/modules/creators/application/use-cases/verify-siret.use-case';
import { CreateStripeAccountUseCase } from '@/modules/creators/application/use-cases/create-stripe-account.use-case';
import { ActivateCreatorAccountUseCase } from '@/modules/creators/application/use-cases/activate-creator-account.use-case';
import { DataGouvSiretService } from '@/modules/creators/infrastructure/services/data-gouv-siret.service';
import { StripeConnectService } from '@/modules/creators/infrastructure/services/stripe-connect.service';
import { PrismaUserRoleRepository } from '@/modules/creators/infrastructure/repositories/prisma-user-role.repository';

const creatorOnboardingRepository = new PrismaCreatorOnboardingRepository();
const submitProfessionalInfoUseCase = new SubmitProfessionalInfoUseCase(
  creatorOnboardingRepository
);

// Use data.gouv.fr API - free, no authentication required
const siretService = new DataGouvSiretService();
const verifySiretUseCase = new VerifySiretUseCase(
  creatorOnboardingRepository,
  siretService
);

const stripeService = new StripeConnectService();
const createStripeAccountUseCase = new CreateStripeAccountUseCase(
  creatorOnboardingRepository,
  stripeService
);

const userRoleRepository = new PrismaUserRoleRepository();
const activateCreatorAccountUseCase = new ActivateCreatorAccountUseCase(
  creatorOnboardingRepository,
  userRoleRepository
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

/**
 * Result of inline SIRET verification (called while user types)
 */
export interface InlineSiretResult {
  status: 'recognized' | 'not-found' | 'inactive' | 'error';
  companyInfo?: {
    companyName: string;
    legalForm?: string;
    address?: { street: string; postalCode: string; city: string };
    activityCode?: string;
    activityLabel?: string;
    creationDate?: string;
  };
  error?: string;
}

export interface ProfessionalInfoInput {
  brandName: string;
  siret: string;
  street: string;
  city: string;
  postalCode: string;
  siretVerifiedInline?: boolean;
}

/**
 * Verify SIRET inline (called while user types, debounced)
 *
 * Lightweight server action that calls data.gouv.fr API directly.
 * No auth/onboarding required - purely informational verification.
 */
export async function verifySiretInline(siret: string): Promise<InlineSiretResult> {
  const result = await siretService.verifySiret(siret);

  if (result.isFailure) {
    const error = result.error!;
    // Distinguish between "not found" and other errors
    if (error.includes('non trouvé')) {
      return { status: 'not-found', error };
    }
    if (error.includes('plus actif')) {
      return { status: 'inactive', error };
    }
    return { status: 'error', error };
  }

  const data = result.value;
  return {
    status: 'recognized',
    companyInfo: {
      companyName: data.companyName,
      legalForm: data.legalForm,
      address: data.address,
      activityCode: data.activityCode,
      activityLabel: data.activityLabel,
      creationDate: data.creationDate?.toLocaleDateString('fr-FR'),
    },
  };
}

/**
 * Submit professional info (Step 1)
 *
 * Uses the SubmitProfessionalInfoUseCase for domain validation.
 * If siretVerifiedInline is true, also marks SIRET as verified
 * and skips directly to Stripe Connect step.
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

  // If SIRET was verified inline, also mark as verified to skip Step 2
  if (input.siretVerifiedInline) {
    const onboarding = await creatorOnboardingRepository.findByUserId(
      session.user.id
    );
    if (onboarding) {
      onboarding.verifySiret();
      await creatorOnboardingRepository.save(onboarding);
    }
  }

  revalidatePath('/onboarding/creator');

  return { success: true };
}

/**
 * Verify SIRET (Step 2)
 *
 * Uses the VerifySiretUseCase to verify SIRET via data.gouv.fr Sirene API.
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

/**
 * Activate creator account
 *
 * Called after completing all onboarding steps to activate the creator account.
 * Changes user role from CLIENT to CREATOR.
 */
export async function activateCreatorAccount(): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const result = await activateCreatorAccountUseCase.execute({
    userId: session.user.id,
  });

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  revalidatePath('/onboarding/creator');
  revalidatePath('/dashboard');

  return { success: true };
}
