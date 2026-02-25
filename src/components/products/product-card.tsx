import Image from 'next/image';
import Link from 'next/link';
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
    <Link href={`/${creatorSlug}/products/${product.id}`} className="group">
      <div className="overflow-hidden">
        <div className="aspect-square relative bg-muted overflow-hidden rounded-[15px]">
          {product.mainImageUrl ? (
            <Image
              src={product.mainImageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-4xl">📦</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold uppercase truncate font-[family-name:var(--font-montserrat)]">
            {product.name}
          </h3>
          <p className="font-bold mt-2 font-[family-name:var(--font-montserrat)]">
            {formatPrice(product.price * 100)}
          </p>
        </div>
      </div>
    </Link>
  );
}
