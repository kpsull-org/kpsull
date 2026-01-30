'use client';

import { useState } from 'react';
import { ShoppingCart, Check, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/stores/cart.store';

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    mainImageUrl?: string;
  };
  variant?: {
    id: string;
    name: string;
    priceOverride?: number;
  } | null;
  creatorSlug: string;
  disabled?: boolean;
}

export function AddToCartButton({ product, variant, creatorSlug, disabled }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    const price = variant?.priceOverride ?? product.price;

    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id,
        name: variant ? `${product.name} - ${variant.name}` : product.name,
        variantId: variant?.id,
        price: price * 100, // Convert to cents
        image: product.mainImageUrl,
        creatorSlug,
        variantInfo: variant ? { type: 'Variante', value: variant.name } : undefined,
      });
    }

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const incrementQuantity = () => setQuantity((q) => q + 1);
  const decrementQuantity = () => setQuantity((q) => Math.max(1, q - 1));

  return (
    <div className="space-y-4">
      {/* Quantity selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Quantité</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={decrementQuantity}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center font-medium">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={incrementQuantity}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add to cart button */}
      <Button
        onClick={handleAddToCart}
        disabled={disabled || added}
        className="w-full"
        size="lg"
      >
        {added ? (
          <>
            <Check className="h-5 w-5 mr-2" />
            Ajouté au panier
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5 mr-2" />
            Ajouter au panier
          </>
        )}
      </Button>
    </div>
  );
}
