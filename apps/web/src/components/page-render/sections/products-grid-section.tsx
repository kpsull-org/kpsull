import Image from 'next/image';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  slug?: string;
}

interface ProductsGridContent {
  columns?: 2 | 3 | 4;
  products?: Product[];
  showPrices?: boolean;
}

interface ProductsGridSectionProps {
  title: string;
  content: ProductsGridContent;
  creatorSlug: string;
}

export function ProductsGridSection({
  title,
  content,
  creatorSlug,
}: ProductsGridSectionProps) {
  const { columns = 3, products = [], showPrices = true } = content;

  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>
        <div className={`grid grid-cols-1 ${gridCols[columns]} gap-6`}>
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/${creatorSlug}/products/${product.slug || product.id}`}
              className="group"
            >
              <div className="bg-background rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative aspect-square">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">No image</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium truncate">{product.name}</h3>
                  {showPrices && (
                    <p className="text-primary font-bold mt-1">
                      {(product.price / 100).toFixed(2)} €
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
