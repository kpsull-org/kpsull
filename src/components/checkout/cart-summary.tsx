'use client';

import Link from 'next/link';
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
    <div className="border border-black p-6 font-sans sticky top-4">
      <h2 className="text-xs font-bold tracking-widest uppercase mb-6">
        Récapitulatif
      </h2>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-black/60">Sous-total</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-black/60">Livraison</span>
          <span className="text-black/60">
            {shippingEstimate ? formatPrice(shippingEstimate) : 'Calculé au checkout'}
          </span>
        </div>

        <div className="border-t border-black/10 pt-3 flex justify-between font-bold">
          <span className="uppercase tracking-wide text-sm">Total</span>
          <span className="text-lg">{formatPrice(total)}</span>
        </div>

        <p className="text-xs text-black/40">TVA incluse si applicable</p>
      </div>

      <Link
        href="/checkout"
        className="mt-6 w-full block bg-black text-white text-center text-xs font-bold tracking-widest uppercase py-4 hover:bg-black/90 transition-colors"
      >
        Passer la commande
      </Link>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-black/50">
        <ShieldCheck className="h-3.5 w-3.5 text-kpsull-green" />
        <span>Paiement sécurisé par Stripe</span>
      </div>
    </div>
  );
}
