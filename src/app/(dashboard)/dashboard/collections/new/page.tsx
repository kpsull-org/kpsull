import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { CollectionForm } from './collection-form';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Nouvelle collection | Kpsull',
  description: 'Creer une nouvelle collection',
};

export default async function NewCollectionPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    redirect('/mon-compte');
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/collections"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux collections
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Nouvelle collection</h1>
        <p className="text-muted-foreground">
          Creez une collection pour organiser vos produits.
        </p>
      </div>

      <div className="max-w-2xl">
        <CollectionForm mode="create" />
      </div>
    </div>
  );
}
