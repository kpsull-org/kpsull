import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyCart() {
  return (
    <div className="container py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        </div>

        <h1 className="text-2xl font-bold mb-2">Votre panier est vide</h1>

        <p className="text-muted-foreground mb-8">
          Parcourez les creations de nos artisans et trouvez votre bonheur !
        </p>

        <Button asChild size="lg">
          <Link href="/">Decouvrir les createurs</Link>
        </Button>
      </div>
    </div>
  );
}
