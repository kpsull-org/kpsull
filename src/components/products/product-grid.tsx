import { ProductCard } from './product-card';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  mainImageUrl?: string;
}

interface ProductGridProps {
  products: Product[];
  creatorSlug: string;
}

export function ProductGrid({ products, creatorSlug }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Aucun produit disponible</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          creatorSlug={creatorSlug}
        />
      ))}
    </div>
  );
}
