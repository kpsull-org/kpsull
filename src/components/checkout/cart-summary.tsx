'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck } from 'lucide-react';

interface CartSummaryProps {
  subtotal: number;
  shippingEstimate?: number;
  formatPrice: (cents: number) => string;
}

export function CartSummary({
  subtotal,
  shippingEstimate,
  formatPrice,
}: CartSummaryProps) {
  const total = subtotal + (shippingEstimate || 0);

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="font-sans">Resume de la commande</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex justify-between font-sans">
          <span className="text-muted-foreground">Sous-total</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between font-sans">
          <span className="text-muted-foreground">Livraison</span>
          <span className="text-sm text-muted-foreground">
            {shippingEstimate
              ? formatPrice(shippingEstimate)
              : 'Calcule au checkout'}
          </span>
        </div>

        <Separator className="border-black/10" />

        <div className="flex justify-between text-xl font-bold font-sans">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>

        <p className="text-xs text-muted-foreground font-sans">TVA incluse si applicable</p>
      </CardContent>

      <CardFooter className="flex-col gap-4">
        <Button asChild className="w-full bg-primary text-primary-foreground rounded-lg" size="lg">
          <Link href="/checkout">Passer la commande</Link>
        </Button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <span>Paiement securise par Stripe</span>
        </div>
      </CardFooter>
    </Card>
  );
}
