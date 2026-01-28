import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { OnboardingStepper } from '@/components/onboarding/stepper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface CreatorOnboardingLayoutProps {
  children: React.ReactNode;
}

export default async function CreatorOnboardingLayout({
  children,
}: CreatorOnboardingLayoutProps) {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // Redirect if already a creator or admin
  if (session.user.role === 'CREATOR' || session.user.role === 'ADMIN') {
    redirect('/dashboard');
  }

  // Redirect if user doesn't want to be a creator
  if (!session.user.wantsToBeCreator && session.user.accountTypeChosen) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Devenir Créateur</CardTitle>
            <CardDescription>
              Complétez les étapes suivantes pour activer votre compte créateur
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <OnboardingStepper currentStep={1} />
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
