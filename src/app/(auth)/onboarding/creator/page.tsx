import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { PrismaCreatorOnboardingRepository } from '@/modules/creators/infrastructure/repositories/prisma-creator-onboarding.repository';
import { InitiateCreatorUpgradeUseCase } from '@/modules/creators/application/use-cases/initiate-creator-upgrade.use-case';

const creatorOnboardingRepository = new PrismaCreatorOnboardingRepository();
const initiateCreatorUpgradeUseCase = new InitiateCreatorUpgradeUseCase(
  creatorOnboardingRepository
);

export default async function CreatorOnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Initiate or get existing onboarding
  const result = await initiateCreatorUpgradeUseCase.execute({
    userId: session.user.id,
  });

  if (result.isFailure) {
    // Handle error - for now, redirect to profile
    redirect('/profile');
  }

  const onboarding = result.value;

  // Redirect to the current step
  redirect(`/onboarding/creator/step/${onboarding.stepNumber}`);
}
