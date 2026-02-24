import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export function EmptyCart() {
  return (
    <div className="container py-16">
      <div className="max-w-sm mx-auto text-center space-y-6">
        <div className="flex justify-center">
          <div className="border border-black p-6 inline-flex">
            <ShoppingBag className="h-12 w-12" strokeWidth={1} />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-wider uppercase font-sans mb-2">
            Panier vide
          </h1>
          <p className="text-sm text-black/60 font-sans">
            Parcourez les créations de nos artisans et trouvez votre bonheur
          </p>
        </div>

        <Link
          href="/catalogue"
          className="inline-block border border-black px-8 py-3 text-xs font-bold tracking-widest uppercase font-sans hover:bg-black hover:text-white transition-colors"
        >
          Découvrir les créateurs
        </Link>
      </div>
    </div>
  );
}
