import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProfileForm } from './profile-form';
import { BecomeCreatorCard } from './become-creator-card';

export const metadata: Metadata = {
  title: 'Mon Profil | Kpsull',
  description: 'Gérez vos informations de profil sur Kpsull',
};

/**
 * Profile page
 *
 * Allows users to view and edit their profile information.
 *
 * Acceptance Criteria (Story 1-5):
 * - AC1: User can see their current profile information
 * - AC2: User can update their name and profile image
 *
 * Acceptance Criteria (Story 2-1):
 * - AC1: "Devenir Créateur" button visible for CLIENT role
 * - AC4: Button hidden for CREATOR/ADMIN roles
 */
export default async function ProfilePage() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // Show "Become Creator" card for CLIENTs
  const showBecomeCreator = session.user.role === 'CLIENT';

  return (
    <div className="mx-auto w-full max-w-2xl py-10 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mon Profil</h1>
          <p className="text-muted-foreground">
            Gérez vos informations personnelles
          </p>
        </div>
        <ProfileForm
          user={{
            id: session.user.id,
            name: session.user.name ?? '',
            email: session.user.email ?? '',
            image: session.user.image ?? null,
          }}
        />

        {/* Become Creator section - only for CLIENTs */}
        {showBecomeCreator && <BecomeCreatorCard />}
      </div>
    </div>
  );
}
