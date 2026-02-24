"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCartStore } from "@/lib/stores/cart.store";

interface VariantData {
  id: string;
  name: string;
  color: string | null;
  colorCode: string | null;
  images: string[];
  skus: { size: string | null; stock: number }[];
  priceOverride: number | null;
}

interface ProductClientProps {
  productId: string;
  variants: VariantData[];
  selectedVariantId: string;
  productPrice: number;
  productName: string;
  creatorSlug: string;
  brandName?: string | null;
  description?: string | null;
  infoRows?: { key: string; value: string }[];
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function ProductClient({
  productId,
  variants,
  selectedVariantId,
  productPrice,
  productName,
  creatorSlug,
  brandName,
  description,
  infoRows,
}: Readonly<ProductClientProps>) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [currentVariantId, setCurrentVariantId] =
    useState(selectedVariantId);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  const currentVariant =
    variants.find((v) => v.id === currentVariantId) ?? variants[0];

  if (!currentVariant) return null;

  const images = currentVariant.images;
  const mainImage = images[mainImageIndex] ?? images[0] ?? null;
  const displayPrice = currentVariant.priceOverride ?? productPrice;

  const availableSizes = currentVariant.skus.filter(
    (sku) => sku.size !== null
  );

  // Masquer le sélecteur si taille unique (1 seule taille ou libellé "unique")
  const isOnlyUniqueLabel = availableSizes.every(
    (sku) => sku.size?.toLowerCase().replaceAll('-', '').replaceAll(' ', '').includes('unique') ?? false
  );
  const shouldHideSizeSelector =
    availableSizes.length === 1 || (availableSizes.length > 0 && isOnlyUniqueLabel);

  // Taille effective : auto-sélectionnée si taille unique, sinon choix utilisateur
  const effectiveSelectedSize = shouldHideSizeSelector
    ? (availableSizes[0]?.size ?? null)
    : selectedSize;

  const handleVariantChange = (variantId: string) => {
    setCurrentVariantId(variantId);
    setSelectedSize(null);
    setMainImageIndex(0);
    router.push(`/catalogue/${productId}?variant=${variantId}`, {
      scroll: false,
    });
  };

  const handleSizeSelect = (size: string, inStock: boolean) => {
    if (!inStock) return;
    setSelectedSize((prev) => (prev === size ? null : size));
  };

  const handleAddToCart = () => {
    const variantId = currentVariant.id;
    const name = effectiveSelectedSize
      ? `${productName} - ${effectiveSelectedSize}`
      : productName;

    addItem({
      productId,
      variantId,
      name,
      price: displayPrice, // déjà en centimes depuis la DB
      image: currentVariant.images[0],
      creatorSlug,
      variantInfo: effectiveSelectedSize
        ? { type: 'Taille', value: effectiveSelectedSize }
        : undefined,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const hasMultipleVariants = variants.length > 1;

  return (
    <div className="flex flex-col lg:flex-row border-b border-black font-[family-name:var(--font-montserrat)]">
      {/* Left: Gallery */}
      <div className="w-full lg:w-[45%] border-r border-black self-start">
        {/* Main image — carrée sans padding */}
        <div className="relative aspect-square w-full overflow-hidden bg-[#F5F5F3]">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={currentVariant.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[10px] uppercase tracking-widest text-black/20">
                Aucune image
              </span>
            </div>
          )}
        </div>

        {/* Thumbnails — carrées agrandies, avec bordures grille */}
        {images.length > 1 && (
          <div className="flex border-t border-black">
            {images.map((img, idx) => (
              <button
                key={img}
                onClick={() => setMainImageIndex(idx)}
                className={`w-24 aspect-square flex-shrink-0 relative overflow-hidden border-r border-black transition-opacity ${
                  idx === mainImageIndex
                    ? "opacity-100"
                    : "opacity-40 hover:opacity-70"
                }`}
              >
                <Image
                  src={img}
                  alt={`Vue ${idx + 1}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Product info — sticky */}
      <div className="w-full lg:w-[55%] self-start">
        <div className="p-8 lg:p-10 space-y-5">
          {/* Titre + brand */}
          <div>
            <h1 className="text-base font-bold uppercase tracking-tight text-black">
              {productName}
            </h1>
            {brandName && (
              <p className="mt-1 text-[11px] uppercase tracking-[0.1em] text-black/55">
                {brandName}
              </p>
            )}
          </div>

          {/* Description */}
          {description && (
            <p className="text-xs leading-relaxed text-black/65 max-w-prose">
              {description}
            </p>
          )}

          <div className="h-px bg-black/10" />

          {/* Prix */}
          <p className="text-3xl font-bold text-black">
            {formatPrice(displayPrice)}
          </p>

          <div className="h-px bg-black/10" />

          {/* Color swatches */}
          {hasMultipleVariants && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.15em] text-black/55 font-semibold">
                Couleur — {currentVariant.color ?? currentVariant.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => {
                  const isActive = variant.id === currentVariantId;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => handleVariantChange(variant.id)}
                      title={variant.color ?? variant.name}
                      className={`relative w-7 h-7 border-2 transition-all ${
                        isActive ? "border-black" : "border-transparent"
                      }`}
                      style={
                        variant.colorCode
                          ? { backgroundColor: variant.colorCode }
                          : {}
                      }
                      aria-label={variant.color ?? variant.name}
                      aria-pressed={isActive}
                    >
                      {!variant.colorCode && (
                        <span className="text-[7px] uppercase leading-none text-black/60 font-medium">
                          {(variant.color ?? variant.name).slice(0, 3)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size selector — masqué si taille unique */}
          {availableSizes.length > 0 && !shouldHideSizeSelector && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.15em] text-black/55 font-semibold">
                Taille{effectiveSelectedSize ? ` — ${effectiveSelectedSize}` : ""}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {availableSizes.map((sku) => {
                  const size = sku.size as string;
                  const inStock = sku.stock > 0;
                  const isSelected = effectiveSelectedSize === size;

                  let sizeButtonClass: string;
                  if (isSelected) {
                    sizeButtonClass = "bg-black text-white border-black";
                  } else if (inStock) {
                    sizeButtonClass = "bg-transparent text-black/70 border-black/25 hover:border-black/60";
                  } else {
                    sizeButtonClass = "opacity-40 cursor-not-allowed text-black/45 border-black/15 line-through";
                  }

                  return (
                    <button
                      key={size}
                      onClick={() => handleSizeSelect(size, inStock)}
                      disabled={!inStock}
                      className={`px-3 py-1.5 text-[10px] uppercase tracking-wide border transition-all ${sizeButtonClass}`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="h-px bg-black/10" />

          {/* Add to cart */}
          <button
            className="w-full py-4 bg-black text-white text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-black/80 transition-colors disabled:opacity-50"
            disabled={availableSizes.length > 0 && effectiveSelectedSize === null}
            title={
              availableSizes.length > 0 && effectiveSelectedSize === null
                ? "Veuillez sélectionner une taille"
                : undefined
            }
            onClick={handleAddToCart}
          >
            {addedToCart ? "✓ Ajouté au panier" : "Ajouter au panier"}
          </button>

          {!shouldHideSizeSelector && availableSizes.length > 0 && effectiveSelectedSize === null && (
            <p className="text-[10px] uppercase tracking-[0.1em] text-black/50 text-center -mt-3">
              Sélectionnez une taille
            </p>
          )}

          {/* Informations produit */}
          {infoRows && infoRows.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <p className="text-[10px] uppercase tracking-[0.15em] text-black/55 font-semibold mb-3">
                Informations
              </p>
              {infoRows.map((row) => (
                <div
                  key={row.key}
                  className="flex items-baseline justify-between border-b border-black/5 pb-1.5"
                >
                  <span className="text-[11px] uppercase tracking-[0.08em] text-black/55">
                    {row.key}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.05em] text-black/80 font-medium">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
