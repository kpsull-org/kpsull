import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Commandes | Kpsull',
  description: 'Gerez vos commandes',
};

export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (dbUser?.role !== 'CREATOR' && dbUser?.role !== 'ADMIN') {
      redirect('/mon-compte');
    }
  }

  // TODO: Fetch real orders from repository

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Commandes</h1>
        <p className="text-muted-foreground">
          Suivez et gerez vos commandes en cours.
        </p>
      </div>

      {/* Empty state */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Aucune commande</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Vos commandes apparaitront ici des que vos premiers clients
            passeront commande sur votre boutique.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
