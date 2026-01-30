'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/format';
import { ProductGallery } from './product-gallery';
import { VariantSelector } from './variant-selector';
import { AddToCartButton } from './add-to-cart-button';

interface ProductImage {
  id: string;
  url: string;
  alt: string;
  position: number;
}

interface ProductVariant {
  id: string;
  name: string;
  priceOverride?: number;
  stock: number;
  isAvailable: boolean;
}

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    mainImageUrl?: string;
    images: ProductImage[];
    variants: ProductVariant[];
  };
  creatorSlug: string;
}

export function ProductDetail({ product, creatorSlug }: ProductDetailProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants.length > 0 ? (product.variants[0]?.id ?? null) : null
  );

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);
  const displayPrice = selectedVariant?.priceOverride ?? product.price;

  // Check if product is available (has stock or no variants)
  const isAvailable =
    product.variants.length === 0 ||
    product.variants.some((v) => v.isAvailable);

  return (
    <div className="container py-8">
      {/* Back link */}
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/${creatorSlug}/products`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux produits
        </Link>
      </Button>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <ProductGallery images={product.images} productName={product.name} />

        {/* Product info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-2xl font-bold text-primary mt-2">
              {formatPrice(displayPrice * 100)}
            </p>
          </div>

          {product.description && (
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground">{product.description}</p>
            </div>
          )}

          {/* Variant selector */}
          {product.variants.length > 0 && (
            <VariantSelector
              variants={product.variants}
              selectedVariantId={selectedVariantId}
              onSelectVariant={setSelectedVariantId}
              basePrice={product.price}
            />
          )}

          {/* Add to cart */}
          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              price: displayPrice,
              mainImageUrl: product.mainImageUrl,
            }}
            variant={selectedVariant ? {
              id: selectedVariant.id,
              name: selectedVariant.name,
              priceOverride: selectedVariant.priceOverride,
            } : null}
            creatorSlug={creatorSlug}
            disabled={!isAvailable}
          />

          {!isAvailable && (
            <p className="text-sm text-destructive">
              Ce produit est actuellement indisponible
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
