import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  UserCircle,
  Package,
  CreditCard,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { BecomeCreatorCard } from '@/app/(client)/profile/become-creator-card';

export const metadata: Metadata = {
  title: 'Mon Compte | Kpsull',
  description: 'Gerez votre compte Kpsull',
};

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Acheteur',
  CREATOR: 'Createur',
  ADMIN: 'Administrateur',
};

interface AccountLink {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default async function MonComptePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { user } = session;
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;

  const accountLinks: AccountLink[] = [
    {
      href: '/profile',
      icon: <UserCircle className="h-5 w-5 text-primary" />,
      title: 'Mon Profil',
      description: 'Modifier mes informations personnelles',
    },
    {
      href: '/my-orders',
      icon: <Package className="h-5 w-5 text-primary" />,
      title: 'Mes Commandes',
      description: 'Suivre mes achats et retours',
    },
  ];

  // Add subscription + dashboard for CREATOR/ADMIN only
  if (user.role === 'CREATOR' || user.role === 'ADMIN') {
    accountLinks.push(
      {
        href: '/subscription',
        icon: <CreditCard className="h-5 w-5 text-primary" />,
        title: 'Mon Abonnement',
        description: 'Gerer mon plan et mes paiements',
      },
      {
        href: '/dashboard',
        icon: <LayoutDashboard className="h-5 w-5 text-primary" />,
        title: 'Tableau de bord createur',
        description: 'Gerer mes ventes, clients et retours',
      },
    );
  }

  // Add admin link for ADMIN
  if (user.role === 'ADMIN') {
    accountLinks.push({
      href: '/admin',
      icon: <ShieldCheck className="h-5 w-5 text-primary" />,
      title: 'Administration',
      description: 'Acceder au panneau d\'administration',
    });
  }

  const showBecomeCreator = user.role === 'CLIENT';

  return (
    <div className="mx-auto w-full max-w-2xl py-10 px-4">
      <div className="space-y-8">
        {/* User info header */}
        <div className="flex items-center gap-4">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name ?? ''}
              referrerPolicy="no-referrer"
              className="h-16 w-16 rounded-full object-cover border"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <UserCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {user.name ?? 'Mon Compte'}
            </h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Badge variant="outline" className="shrink-0">
            {roleLabel}
          </Badge>
        </div>

        {/* Navigation cards */}
        <div className="space-y-3">
          {accountLinks.map((link) => (
            <Link key={link.href} href={link.href} className="block">
              <Card className="transition-all hover:border-primary/50 hover:shadow-sm">
                <CardHeader className="flex flex-row items-center gap-4 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    {link.icon}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <CardTitle className="text-base">{link.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {link.description}
                    </CardDescription>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {/* Become creator CTA */}
        {showBecomeCreator && <BecomeCreatorCard />}

        {/* Sign out */}
        <div className="flex justify-center pt-4">
          <SignOutButton
            variant="outline"
            callbackUrl="/"
            className="w-full max-w-xs"
          />
        </div>
      </div>
    </div>
  );
}
