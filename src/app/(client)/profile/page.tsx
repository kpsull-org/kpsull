import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileForm } from './profile-form';
import { BecomeCreatorCard } from './become-creator-card';
import { prisma } from '@/lib/prisma/client';

export const metadata: Metadata = {
  title: 'Mon Profil | Kpsull',
  description: 'Gerez vos informations de profil sur Kpsull',
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch user data including phone/address fields not available in session
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      phone: true,
      address: true,
      city: true,
      postalCode: true,
      country: true,
    },
  });

  const showBecomeCreator = session.user.role === 'CLIENT';

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/mon-compte">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mon Profil</h1>
            <p className="text-muted-foreground">
              Gerez vos informations personnelles
            </p>
          </div>
        </div>

        <ProfileForm
          user={{
            id: session.user.id,
            name: session.user.name ?? '',
            email: session.user.email ?? '',
            image: session.user.image ?? null,
            phone: dbUser?.phone ?? null,
            address: dbUser?.address ?? null,
            city: dbUser?.city ?? null,
            postalCode: dbUser?.postalCode ?? null,
            country: dbUser?.country ?? null,
          }}
        />

        {showBecomeCreator && <BecomeCreatorCard />}
      </div>
    </div>
  );
}
