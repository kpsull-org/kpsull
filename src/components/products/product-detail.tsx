'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatPrice } from '@/lib/utils/format';
import { ProductGallery } from './product-gallery';
import { AddToCartButton } from './add-to-cart-button';

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
    images: string[];
    variants: ProductVariant[];
  };
  creatorSlug: string;
  isOwnProduct?: boolean;
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

export function ProductDetail({ product, creatorSlug, isOwnProduct = false }: ProductDetailProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const selectedVariantId = product.variants.length > 0 ? (product.variants[0]?.id ?? null) : null;

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
            <h1 className="text-[32px] font-semibold uppercase font-[family-name:var(--font-montserrat)]">
              {product.name}
            </h1>
            <p className="text-2xl font-bold mt-2 font-[family-name:var(--font-montserrat)]">
              {formatPrice(displayPrice * 100)}
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="details" className="w-full">
            <TabsList variant="line" className="w-full justify-start border-b">
              <TabsTrigger value="fit" className="uppercase font-[family-name:var(--font-montserrat)] text-sm">
                Taille & Coupe
              </TabsTrigger>
              <TabsTrigger value="details" className="uppercase font-[family-name:var(--font-montserrat)] text-sm">
                Détails
              </TabsTrigger>
              <TabsTrigger value="shipping" className="uppercase font-[family-name:var(--font-montserrat)] text-sm">
                Livraison
              </TabsTrigger>
              <TabsTrigger value="reviews" className="uppercase font-[family-name:var(--font-montserrat)] text-sm">
                Avis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fit" className="mt-4">
              <p className="text-sm text-muted-foreground">Informations sur la taille et la coupe du produit.</p>
            </TabsContent>

            <TabsContent value="details" className="mt-4">
              {product.description && (
                <p className="text-sm text-muted-foreground">{product.description}</p>
              )}
            </TabsContent>

            <TabsContent value="shipping" className="mt-4">
              <p className="text-sm text-muted-foreground">Informations de livraison.</p>
            </TabsContent>

            <TabsContent value="reviews" className="mt-4">
              <p className="text-sm text-muted-foreground">Aucun avis pour le moment.</p>
            </TabsContent>
          </Tabs>

          {/* Size selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium font-[family-name:var(--font-montserrat)]">Taille</p>
              <Link href="#" className="text-sm underline font-[family-name:var(--font-montserrat)]">
                Guide de taille
              </Link>
            </div>
            <div className="flex gap-2">
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`rounded-full px-6 py-2 text-sm font-medium transition-colors font-[family-name:var(--font-montserrat)] ${
                    selectedSize === size
                      ? 'bg-black text-white'
                      : 'bg-transparent border border-black text-black hover:bg-gray-100'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Add to cart */}
          <div className="space-y-3">
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
              disabled={!isAvailable || isOwnProduct}
              isOwnProduct={isOwnProduct}
              className="w-full bg-secondary text-black rounded-full py-4 px-8 font-bold uppercase font-[family-name:var(--font-montserrat)] hover:opacity-90"
              buttonText="AJOUTER AU PANIER"
            />

            <Button
              variant="outline"
              className="w-full bg-black text-white rounded-full py-4 px-8 font-bold uppercase font-[family-name:var(--font-montserrat)] hover:bg-black/90 hover:text-white"
            >
              <Heart className="h-4 w-4 mr-2" />
              Ajouter aux favoris
            </Button>
          </div>

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
