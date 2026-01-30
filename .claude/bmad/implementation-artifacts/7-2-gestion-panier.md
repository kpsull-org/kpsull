# Story 7.2: Gestion du Panier

Status: ready-for-dev

## Story

As a Client,
I want modifier mon panier,
so that je puisse ajuster ma commande avant paiement.

## Acceptance Criteria

1. **AC1 - Affichage liste articles**
   - **Given** un Client sur la page panier
   - **When** il consulte son panier
   - **Then** il voit la liste des articles avec : image, nom, variante (si applicable), prix unitaire, quantite, sous-total par ligne
   - **And** il voit le total general du panier

2. **AC2 - Modification des quantites**
   - **Given** un article dans le panier
   - **When** le Client modifie la quantite (via +/- ou input direct)
   - **Then** la quantite est mise a jour
   - **And** le sous-total de la ligne est recalcule en temps reel
   - **And** le total du panier est recalcule en temps reel

3. **AC3 - Suppression d'un article**
   - **Given** un article dans le panier
   - **When** le Client clique sur "Supprimer"
   - **Then** l'article est retire du panier
   - **And** le total est mis a jour
   - **And** une confirmation toast s'affiche

4. **AC4 - Panier vide**
   - **Given** un panier sans articles
   - **When** le Client consulte le panier
   - **Then** un message "Votre panier est vide" s'affiche
   - **And** un bouton/lien "Decouvrir les createurs" est affiche

5. **AC5 - Lien vers produit**
   - **Given** un article dans le panier
   - **When** le Client clique sur le nom ou l'image du produit
   - **Then** il est redirige vers la page detail du produit

## Tasks / Subtasks

- [ ] **Task 1: Creer la page panier** (AC: #1, #4)
  - [ ] 1.1 Creer `src/app/(checkout)/cart/page.tsx`
  - [ ] 1.2 Afficher la liste des articles depuis le store
  - [ ] 1.3 Calculer et afficher les totaux
  - [ ] 1.4 Gerer l'etat panier vide

- [ ] **Task 2: Creer le composant CartItem** (AC: #1, #2, #3, #5)
  - [ ] 2.1 Creer `src/components/checkout/cart-item.tsx`
  - [ ] 2.2 Afficher image, nom, variante, prix
  - [ ] 2.3 Ajouter les controles de quantite (+/-)
  - [ ] 2.4 Ajouter le bouton de suppression
  - [ ] 2.5 Ajouter le lien vers le produit

- [ ] **Task 3: Creer le composant QuantitySelector** (AC: #2)
  - [ ] 3.1 Creer `src/components/checkout/quantity-selector.tsx`
  - [ ] 3.2 Implementer les boutons +/-
  - [ ] 3.3 Gerer la validation (min 1, max stock si applicable)

- [ ] **Task 4: Creer le composant CartSummary** (AC: #1)
  - [ ] 4.1 Creer `src/components/checkout/cart-summary.tsx`
  - [ ] 4.2 Afficher sous-total, estimation livraison, total
  - [ ] 4.3 Ajouter le bouton "Passer la commande"

- [ ] **Task 5: Creer le composant EmptyCart** (AC: #4)
  - [ ] 5.1 Creer `src/components/checkout/empty-cart.tsx`
  - [ ] 5.2 Afficher illustration et message
  - [ ] 5.3 Ajouter CTA de redirection

- [ ] **Task 6: Ecrire les tests** (AC: #1-5)
  - [ ] 6.1 Tests pour la page panier
  - [ ] 6.2 Tests pour CartItem (modification quantite, suppression)
  - [ ] 6.3 Tests pour les calculs de totaux

## Dev Notes

### Page Panier

```typescript
// src/app/(checkout)/cart/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/stores/cart.store";
import { CartItem } from "@/components/checkout/cart-item";
import { CartSummary } from "@/components/checkout/cart-summary";
import { EmptyCart } from "@/components/checkout/empty-cart";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  useEffect(() => {
    setMounted(true);
    useCartStore.persist.rehydrate();
  }, []);

  if (!mounted) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyCart />;
  }

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continuer mes achats
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-8">Mon Panier</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Liste des articles */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <CartItem
              key={`${item.productId}-${item.variantId || "default"}`}
              item={item}
              onUpdateQuantity={(quantity) =>
                updateQuantity(item.productId, quantity, item.variantId)
              }
              onRemove={() => removeItem(item.productId, item.variantId)}
              formatPrice={formatPrice}
            />
          ))}
        </div>

        {/* Resume */}
        <div className="lg:col-span-1">
          <CartSummary
            subtotal={getTotal()}
            formatPrice={formatPrice}
          />
        </div>
      </div>
    </div>
  );
}
```

### Composant CartItem

```typescript
// src/components/checkout/cart-item.tsx
import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuantitySelector } from "./quantity-selector";
import type { CartItem as CartItemType } from "@/lib/stores/cart.store";
import { toast } from "sonner";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  formatPrice: (cents: number) => string;
}

export function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  formatPrice,
}: CartItemProps) {
  const handleRemove = () => {
    onRemove();
    toast.success("Article retire du panier");
  };

  const lineTotal = item.price * item.quantity;

  return (
    <Card className="p-4">
      <div className="flex gap-4">
        {/* Image */}
        <Link
          href={`/${item.creatorSlug}/products/${item.productId}`}
          className="flex-shrink-0"
        >
          <div className="relative w-24 h-24 rounded-md overflow-hidden">
            <Image
              src={item.image || "/placeholder-product.png"}
              alt={item.name}
              fill
              className="object-cover hover:scale-105 transition-transform"
            />
          </div>
        </Link>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/${item.creatorSlug}/products/${item.productId}`}
            className="hover:underline"
          >
            <h3 className="font-semibold truncate">{item.name}</h3>
          </Link>

          {item.variantInfo && (
            <p className="text-sm text-muted-foreground">
              {item.variantInfo.type}: {item.variantInfo.value}
            </p>
          )}

          <p className="text-sm text-muted-foreground mt-1">
            {formatPrice(item.price)} / unite
          </p>

          {/* Controles mobile */}
          <div className="flex items-center gap-4 mt-3 lg:hidden">
            <QuantitySelector
              value={item.quantity}
              onChange={onUpdateQuantity}
              min={1}
              max={99}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Controles desktop */}
        <div className="hidden lg:flex items-center gap-6">
          <QuantitySelector
            value={item.quantity}
            onChange={onUpdateQuantity}
            min={1}
            max={99}
          />

          <div className="w-24 text-right">
            <p className="font-semibold">{formatPrice(lineTotal)}</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Total ligne mobile */}
      <div className="lg:hidden mt-3 pt-3 border-t flex justify-between">
        <span className="text-sm text-muted-foreground">Sous-total</span>
        <span className="font-semibold">{formatPrice(lineTotal)}</span>
      </div>
    </Card>
  );
}
```

### Composant QuantitySelector

```typescript
// src/components/checkout/quantity-selector.tsx
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled,
}: QuantitySelectorProps) {
  const handleDecrease = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={handleDecrease}
        disabled={disabled || value <= min}
      >
        <Minus className="h-3 w-3" />
      </Button>

      <Input
        type="number"
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        disabled={disabled}
        className="w-14 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={handleIncrease}
        disabled={disabled || value >= max}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}
```

### Composant CartSummary

```typescript
// src/components/checkout/cart-summary.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck } from "lucide-react";

interface CartSummaryProps {
  subtotal: number;
  shippingEstimate?: number;
  formatPrice: (cents: number) => string;
}

export function CartSummary({
  subtotal,
  shippingEstimate,
  formatPrice,
}: CartSummaryProps) {
  const total = subtotal + (shippingEstimate || 0);

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Resume de la commande</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Sous-total</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Livraison</span>
          <span className="text-sm text-muted-foreground">
            {shippingEstimate
              ? formatPrice(shippingEstimate)
              : "Calcule au checkout"}
          </span>
        </div>

        <Separator />

        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>

        <p className="text-xs text-muted-foreground">
          TVA incluse si applicable
        </p>
      </CardContent>

      <CardFooter className="flex-col gap-4">
        <Button asChild className="w-full" size="lg">
          <Link href="/checkout">Passer la commande</Link>
        </Button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <span>Paiement securise par Stripe</span>
        </div>
      </CardFooter>
    </Card>
  );
}
```

### Composant EmptyCart

```typescript
// src/components/checkout/empty-cart.tsx
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

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
```

### References

- [Source: architecture.md#Checkout Flow]
- [Source: prd.md#FR31]
- [Source: epics.md#Story 7.2]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
