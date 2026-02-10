'use client';

import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';

/**
 * BecomeCreatorCard component
 *
 * Displays a call-to-action for clients to become creators.
 * Visible only on the profile page for users with CLIENT role.
 *
 * Acceptance Criteria (Story 2-1):
 * - AC1: Button visible for CLIENT role
 * - AC2: Redirects to onboarding on click
 */
export function BecomeCreatorCard() {
  const router = useRouter();

  function handleClick() {
    router.push('/devenir-createur');
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Devenez Créateur</CardTitle>
        </div>
        <CardDescription>
          Vendez vos créations sur Kpsull et atteignez des milliers de clients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Créez votre boutique personnalisée
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Recevez vos paiements de manière sécurisée
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Accédez à des outils de gestion avancés
          </li>
        </ul>

        <Button onClick={handleClick} className="w-full">
          Devenir Créateur
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
