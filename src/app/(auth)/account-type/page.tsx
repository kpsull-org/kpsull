import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AccountTypeCard } from './account-type-card';

export default async function AccountTypePage() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // Redirect if account type already chosen
  if (session.user.accountTypeChosen) {
    if (session.user.wantsToBeCreator) {
      redirect('/onboarding/creator');
    } else {
      redirect('/');
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center px-4">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[550px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Bienvenue sur Kpsull !
          </h1>
          <p className="text-muted-foreground">
            Comment souhaitez-vous utiliser la plateforme ?
          </p>
        </div>
        <AccountTypeCard />
      </div>
    </div>
  );
}
