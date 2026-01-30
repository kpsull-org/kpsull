import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { PrismaCreatorOnboardingRepository } from '@/modules/creators/infrastructure/repositories/prisma-creator-onboarding.repository';
import { ProfessionalInfoForm } from './professional-info-form';
import { SiretVerificationForm } from './siret-verification-form';
import { StripeConnectForm } from './stripe-connect-form';

const creatorOnboardingRepository = new PrismaCreatorOnboardingRepository();

/**
 * Parse formatted address back to individual fields
 * Format: "street, postalCode city, country"
 */
function parseAddress(address: string | null): {
  street: string;
  city: string;
  postalCode: string;
} {
  if (!address) {
    return { street: '', city: '', postalCode: '' };
  }

  try {
    // Format: "10 rue de la Paix, 75001 Paris, France"
    const parts = address.split(', ');
    if (parts.length < 2) {
      return { street: address, city: '', postalCode: '' };
    }

    const street = parts[0] ?? '';
    const cityPart = parts[1] ?? ''; // "75001 Paris"

    // Extract postal code and city from "75001 Paris"
    const cityMatch = cityPart.match(/^(\d{5})\s+(.+)$/);
    if (cityMatch) {
      return {
        street,
        postalCode: cityMatch[1] ?? '',
        city: cityMatch[2] ?? '',
      };
    }

    return { street, city: cityPart, postalCode: '' };
  } catch {
    return { street: '', city: '', postalCode: '' };
  }
}

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
    case 1: {
      // Parse address if it exists (format: "street, postalCode city, country")
      const addressParts = parseAddress(onboarding.professionalAddress);
      return (
        <ProfessionalInfoForm
          defaultValues={{
            brandName: onboarding.brandName ?? '',
            siret: onboarding.siret ?? '',
            street: addressParts.street,
            city: addressParts.city,
            postalCode: addressParts.postalCode,
          }}
        />
      );
    }
    case 2:
      return (
        <SiretVerificationForm
          siret={onboarding.siret ?? ''}
          isVerified={onboarding.siretVerified}
          brandName={onboarding.brandName ?? undefined}
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
