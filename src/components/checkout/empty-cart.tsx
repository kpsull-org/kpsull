import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

export function EmptyCart() {
  return (
    <div className="container py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-center mb-6">
          <Logo size="lg" className="text-secondary" />
        </div>

        <h1 className="text-2xl font-bold mb-2 font-sans">Votre panier est vide</h1>

        <p className="text-muted-foreground mb-8 font-sans">
          Parcourez les creations de nos artisans et trouvez votre bonheur !
        </p>

        <Link href="/catalogue" className="text-primary underline font-sans">
          Decouvrir les createurs
        </Link>
      </div>
    </div>
  );
}
