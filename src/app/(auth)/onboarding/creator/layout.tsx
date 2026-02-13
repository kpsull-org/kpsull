import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { OnboardingStepper } from '@/components/onboarding/stepper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PrismaCreatorOnboardingRepository } from '@/modules/creators/infrastructure/repositories/prisma-creator-onboarding.repository';

const creatorOnboardingRepository = new PrismaCreatorOnboardingRepository();

/**
 * Maps backend step numbers (1-4) to visual step numbers (1-2)
 * Backend: 1=PROFESSIONAL_INFO, 2=SIRET_VERIFICATION, 3=STRIPE_CONNECT, 4=COMPLETED
 * Visual:  1=Informations & SIRET, 2=Paiements
 */
function toVisualStep(backendStep: number): number {
  if (backendStep <= 2) return 1; // Step 1 & 2 (SIRET auto-verified) → Visual Step 1
  if (backendStep === 3) return 2; // Stripe Connect → Visual Step 2
  return 3; // Completed → past all visual steps
}

interface CreatorOnboardingLayoutProps {
  children: React.ReactNode;
}

export default async function CreatorOnboardingLayout({
  children,
}: CreatorOnboardingLayoutProps) {
  let session = null;
  try {
    session = await auth();
  } catch {
    // JWTSessionError: invalid/expired token — treat as unauthenticated
  }

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // Redirect if already a creator or admin
  if (session.user.role === 'CREATOR' || session.user.role === 'ADMIN') {
    redirect('/dashboard');
  }

  // Read actual onboarding step from DB
  const onboarding = await creatorOnboardingRepository.findByUserId(
    session.user.id
  );
  const backendStep = onboarding?.currentStep.stepNumber ?? 1;
  const visualStep = toVisualStep(backendStep);

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Devenir Créateur</CardTitle>
        <CardDescription>
          Complétez les étapes suivantes pour activer votre compte créateur
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <OnboardingStepper currentStep={visualStep} />
        {children}
      </CardContent>
    </Card>
  );
}
