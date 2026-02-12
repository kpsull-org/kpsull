import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { PrismaCreatorOnboardingRepository } from '@/modules/creators/infrastructure/repositories/prisma-creator-onboarding.repository';
import { OnboardingCompletionForm } from './completion-form';

const creatorOnboardingRepository = new PrismaCreatorOnboardingRepository();

export default async function CompletePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Get onboarding status
  const onboarding = await creatorOnboardingRepository.findByUserId(
    session.user.id
  );

  if (!onboarding) {
    redirect('/onboarding/creator');
  }

  // Check if all steps are completed
  if (!onboarding.siretVerified || !onboarding.stripeOnboarded) {
    // Redirect to the appropriate step
    if (!onboarding.professionalInfoCompleted) {
      redirect('/onboarding/creator/step/1');
    } else if (!onboarding.siretVerified) {
      redirect('/onboarding/creator/step/2');
    } else {
      redirect('/onboarding/creator/step/3');
    }
  }

  // If already activated as creator, redirect to dashboard
  if (session.user.role === 'CREATOR' || session.user.role === 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <OnboardingCompletionForm
      brandName={onboarding.brandName ?? 'Votre boutique'}
      siret={onboarding.siret ?? ''}
      address={onboarding.professionalAddress ?? ''}
      stripeAccountId={onboarding.stripeAccountId ?? ''}
    />
  );
}
