import { Metadata } from 'next';
import { ModerationPageClient } from './page-client';

export const metadata: Metadata = {
  title: 'Moderation | Admin Kpsull',
  description: 'Gerez les contenus signales par les utilisateurs',
};

/**
 * Admin Moderation Page
 *
 * Story 11-5: Controle contenu
 *
 * Server component wrapper. Data fetching happens through server actions
 * called by the client component.
 */
export default function ModerationPage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Moderation du contenu</h1>
        <p className="text-muted-foreground mt-1">
          Gerez les contenus signales par les utilisateurs
        </p>
      </div>

      <ModerationPageClient />
    </div>
  );
}
