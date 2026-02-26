'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface CartSummaryProps {
  readonly subtotal: number;
  readonly shippingEstimate?: number;
  readonly formatPrice: (cents: number) => string;
}

export function CartSummary({
  subtotal,
  shippingEstimate,
  formatPrice,
}: CartSummaryProps) {
  const total = subtotal + (shippingEstimate || 0);

  return (
    <div className="bg-white border border-black/12 p-6 shadow-sm font-sans lg:sticky lg:top-8">
      <h2 className="text-[10px] font-bold tracking-widest uppercase text-black/50 mb-6">
        Récapitulatif
      </h2>

      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-black/60">Sous-total</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>

        <div className="border-t border-black/6 pt-4 flex justify-between text-sm">
          <span className="text-black/60">Livraison</span>
          <span className="text-black/50 text-xs leading-5">
            {shippingEstimate ? formatPrice(shippingEstimate) : 'Calculé au checkout'}
          </span>
        </div>

        <div className="border-t border-black/10 pt-4 flex justify-between font-bold">
          <span className="uppercase tracking-wide text-sm">Total</span>
          <span className="text-lg">{formatPrice(total)}</span>
        </div>

        <p className="text-xs text-black/40">TVA incluse si applicable</p>
      </div>

      <Link
        href="/checkout"
        className="group mt-6 w-full flex items-center justify-center gap-3 bg-black text-white text-xs font-bold tracking-widest uppercase py-5 px-6 hover:bg-black/85 transition-colors duration-300"
      >
        <span>Passer la commande</span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 group-hover:translate-x-1 transition-transform duration-300" />
      </Link>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-black/50">
        <ShieldCheck className="h-3.5 w-3.5 text-kpsull-green" />
        <span>Paiement sécurisé par Stripe</span>
      </div>
    </div>
  );
}
