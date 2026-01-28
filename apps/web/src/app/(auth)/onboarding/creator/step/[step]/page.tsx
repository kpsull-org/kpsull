import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { PrismaCreatorOnboardingRepository } from '@/modules/creators/infrastructure/repositories/prisma-creator-onboarding.repository';
import { ProfessionalInfoForm } from './professional-info-form';
import { SiretVerificationForm } from './siret-verification-form';
import { StripeConnectForm } from './stripe-connect-form';

const creatorOnboardingRepository = new PrismaCreatorOnboardingRepository();

interface StepPageProps {
  params: Promise<{
    step: string;
  }>;
}

export default async function StepPage({ params }: StepPageProps) {
  const { step } = await params;
  const stepNumber = parseInt(step, 10);

  // Validate step number
  if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 3) {
    notFound();
  }

  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Get onboarding status
  const onboarding = await creatorOnboardingRepository.findByUserId(
    session.user.id
  );

  if (!onboarding) {
    // No onboarding found, redirect to start
    redirect('/onboarding/creator');
  }

  // Check if user is on the correct step
  const currentStepNumber = onboarding.currentStep.stepNumber;

  // If completed, redirect to dashboard
  if (onboarding.isFullyCompleted) {
    redirect('/dashboard');
  }

  // If trying to access a future step, redirect to current step
  if (stepNumber > currentStepNumber) {
    redirect(`/onboarding/creator/step/${currentStepNumber}`);
  }

  // Render appropriate form based on step
  switch (stepNumber) {
    case 1:
      return (
        <ProfessionalInfoForm
          defaultValues={{
            brandName: onboarding.brandName ?? '',
            siret: onboarding.siret ?? '',
            professionalAddress: onboarding.professionalAddress ?? '',
          }}
        />
      );
    case 2:
      return (
        <SiretVerificationForm
          siret={onboarding.siret ?? ''}
          isVerified={onboarding.siretVerified}
        />
      );
    case 3:
      return (
        <StripeConnectForm
          stripeAccountId={onboarding.stripeAccountId}
          isOnboarded={onboarding.stripeOnboarded}
        />
      );
    default:
      notFound();
  }
}
