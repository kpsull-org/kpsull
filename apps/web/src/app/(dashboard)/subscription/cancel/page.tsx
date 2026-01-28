import Link from 'next/link';
import { XCircle, ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Paiement annulé | Kpsull',
  description: 'Votre paiement a été annulé',
};

export default function CancelPage() {
  return (
    <div className="container max-w-2xl py-16">
      <Card className="text-center">
        <CardHeader className="pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <XCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">
            Paiement annulé
          </CardTitle>
          <CardDescription className="text-base">
            Votre paiement n&apos;a pas été effectué
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Vous avez annulé le processus de paiement. Aucun montant n&apos;a été débité de votre compte.
          </p>

          <div className="rounded-lg bg-muted p-4">
            <h3 className="font-medium mb-2">Besoin d&apos;aide ?</h3>
            <p className="text-sm text-muted-foreground">
              Si vous avez rencontré un problème lors du paiement ou si vous avez des questions sur nos plans, n&apos;hésitez pas à nous contacter.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild>
              <Link href="/subscription/upgrade">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux plans
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">
                <MessageCircle className="mr-2 h-4 w-4" />
                Nous contacter
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
