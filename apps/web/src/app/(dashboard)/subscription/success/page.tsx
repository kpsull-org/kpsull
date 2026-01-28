import Link from 'next/link';
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Bienvenue en PRO ! | Kpsull',
  description: 'Votre upgrade vers le plan PRO est confirmé',
};

export default function SuccessPage() {
  return (
    <div className="container max-w-2xl py-16">
      <Card className="text-center">
        <CardHeader className="pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">
            Bienvenue dans Kpsull PRO !
          </CardTitle>
          <CardDescription className="text-base">
            Votre abonnement a été activé avec succès
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4">
            <h3 className="font-medium flex items-center justify-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              Ce que vous pouvez faire maintenant
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>Publier un nombre illimité de produits</li>
              <li>Accepter des ventes sans limite</li>
              <li>Accéder aux analytics avancés</li>
              <li>Exporter vos rapports de ventes</li>
              <li>Bénéficier du support prioritaire</li>
            </ul>
          </div>

          <p className="text-sm text-muted-foreground">
            Un email de confirmation a été envoyé à votre adresse email avec les détails de votre abonnement.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild>
              <Link href="/dashboard">
                Aller au dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/subscription">
                Voir mon abonnement
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
