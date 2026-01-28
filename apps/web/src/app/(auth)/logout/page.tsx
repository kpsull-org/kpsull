import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LogoutCard } from './logout-card';

export const metadata: Metadata = {
  title: 'Déconnexion | Kpsull',
  description: 'Déconnectez-vous de votre compte Kpsull',
};

/**
 * Logout page
 *
 * Allows users to confirm their sign out.
 * If not logged in, redirects to home.
 *
 * Acceptance Criteria (Story 1-4):
 * - AC3: User can sign out and is redirected to home
 */
export default async function LogoutPage() {
  const session = await auth();

  // Redirect to home if not logged in
  if (!session?.user) {
    redirect('/');
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <LogoutCard userName={session.user.name ?? session.user.email ?? 'Utilisateur'} />
      </div>
    </div>
  );
}
