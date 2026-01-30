import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils/format';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    mainImageUrl?: string;
  };
  creatorSlug: string;
}

export function ProductCard({ product, creatorSlug }: ProductCardProps) {
  return (
    <Link href={`/${creatorSlug}/products/${product.id}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
        <div className="aspect-square relative bg-muted overflow-hidden">
          {product.mainImageUrl ? (
            <Image
              src={product.mainImageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-4xl">📦</span>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-medium truncate group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {product.description}
            </p>
          )}
          <p className="font-bold mt-2">{formatPrice(product.price * 100)}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
