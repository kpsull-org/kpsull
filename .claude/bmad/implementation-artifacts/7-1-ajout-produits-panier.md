# Story 7.1: Ajout de Produits au Panier

Status: ready-for-dev

## Story

As a visiteur,
I want ajouter des produits a mon panier,
so that je puisse preparer ma commande.

## Acceptance Criteria

1. **AC1 - Ajout simple au panier**
   - **Given** un visiteur sur la page d'un produit sans variantes
   - **When** il clique sur "Ajouter au panier"
   - **Then** le produit est ajoute au panier (localStorage si non connecte)
   - **And** le compteur panier dans le header est mis a jour
   - **And** une confirmation visuelle (toast) s'affiche

2. **AC2 - Validation variante obligatoire**
   - **Given** un produit avec variantes (taille, couleur, etc.)
   - **When** le visiteur clique sur "Ajouter au panier" sans selectionner de variante
   - **Then** un message d'erreur lui demande de choisir une variante
   - **And** le produit n'est pas ajoute au panier

3. **AC3 - Ajout avec variante selectionnee**
   - **Given** un produit avec variantes
   - **When** le visiteur selectionne une variante et clique sur "Ajouter au panier"
   - **Then** le produit avec la variante selectionnee est ajoute au panier
   - **And** le prix de la variante est enregistre

4. **AC4 - Incrementation quantite**
   - **Given** un produit deja present dans le panier
   - **When** le visiteur ajoute le meme produit (meme variante si applicable)
   - **Then** la quantite est incrementee de 1
   - **And** le total du panier est recalcule

5. **AC5 - Synchronisation panier a la connexion**
   - **Given** un visiteur avec un panier en localStorage
   - **When** il se connecte a son compte
   - **Then** le panier localStorage est fusionne avec le panier serveur (si existant)
   - **And** les doublons sont fusionnes en incrementant les quantites

## Tasks / Subtasks

- [ ] **Task 1: Creer le module Cart domain** (AC: #1, #4)
  - [ ] 1.1 Creer `src/modules/cart/domain/entities/cart.entity.ts`
  - [ ] 1.2 Creer `src/modules/cart/domain/entities/cart-item.entity.ts`
  - [ ] 1.3 Creer `src/modules/cart/domain/value-objects/cart-item-id.vo.ts`
  - [ ] 1.4 Implementer la logique d'ajout et d'incrementation

- [ ] **Task 2: Creer le store Zustand pour le panier** (AC: #1, #4, #5)
  - [ ] 2.1 Creer `src/lib/stores/cart.store.ts`
  - [ ] 2.2 Implementer la persistence localStorage
  - [ ] 2.3 Ajouter les actions: addItem, removeItem, updateQuantity, clearCart

- [ ] **Task 3: Creer le composant AddToCartButton** (AC: #1, #2, #3)
  - [ ] 3.1 Creer `src/components/public/add-to-cart-button.tsx`
  - [ ] 3.2 Gerer l'etat de chargement et la validation variante
  - [ ] 3.3 Afficher le toast de confirmation

- [ ] **Task 4: Creer le composant CartCounter** (AC: #1)
  - [ ] 4.1 Creer `src/components/layout/cart-counter.tsx`
  - [ ] 4.2 Afficher le nombre d'articles dans le header
  - [ ] 4.3 Animer lors de l'ajout

- [ ] **Task 5: Implementer la synchronisation serveur** (AC: #5)
  - [ ] 5.1 Creer `src/modules/cart/application/use-cases/sync-cart.use-case.ts`
  - [ ] 5.2 Creer `src/app/api/cart/sync/route.ts`
  - [ ] 5.3 Gerer la fusion des paniers

- [ ] **Task 6: Ecrire les tests** (AC: #1-5)
  - [ ] 6.1 Tests unitaires pour Cart entity
  - [ ] 6.2 Tests pour le store Zustand
  - [ ] 6.3 Tests pour le composant AddToCartButton

## Dev Notes

### Cart Store avec Zustand

```typescript
// src/lib/stores/cart.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number; // en centimes
  quantity: number;
  image?: string;
  variantInfo?: {
    type: string;
    value: string;
  };
  creatorSlug: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.productId === item.productId && i.variantId === item.variantId
          );

          if (existingIndex >= 0) {
            // Incrementer la quantite
            const newItems = [...state.items];
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + 1,
            };
            return { items: newItems };
          }

          // Ajouter nouvel item
          return { items: [...state.items, { ...item, quantity: 1 }] };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        }));
      },

      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId && item.variantId === variantId
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "kpsull-cart",
      skipHydration: true,
    }
  )
);
```

### Composant AddToCartButton

```typescript
// src/components/public/add-to-cart-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart.store";
import { toast } from "sonner";

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  price: number;
  image?: string;
  creatorSlug: string;
  selectedVariant?: {
    id: string;
    type: string;
    value: string;
    price?: number;
  };
  hasVariants: boolean;
  disabled?: boolean;
}

export function AddToCartButton({
  productId,
  productName,
  price,
  image,
  creatorSlug,
  selectedVariant,
  hasVariants,
  disabled,
}: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = async () => {
    // Validation variante obligatoire
    if (hasVariants && !selectedVariant) {
      toast.error("Veuillez selectionner une variante");
      return;
    }

    setIsAdding(true);

    try {
      addItem({
        productId,
        variantId: selectedVariant?.id,
        name: productName,
        price: selectedVariant?.price ?? price,
        image,
        creatorSlug,
        variantInfo: selectedVariant
          ? { type: selectedVariant.type, value: selectedVariant.value }
          : undefined,
      });

      setJustAdded(true);
      toast.success("Produit ajoute au panier");

      // Reset l'animation apres 2s
      setTimeout(() => setJustAdded(false), 2000);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Button
      onClick={handleAddToCart}
      disabled={disabled || isAdding}
      className="w-full"
      size="lg"
    >
      {justAdded ? (
        <>
          <Check className="mr-2 h-5 w-5" />
          Ajoute !
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-5 w-5" />
          Ajouter au panier
        </>
      )}
    </Button>
  );
}
```

### Composant CartCounter

```typescript
// src/components/layout/cart-counter.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/stores/cart.store";
import { cn } from "@/lib/utils";

export function CartCounter() {
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const itemCount = useCartStore((state) => state.getItemCount());

  // Hydration safe
  useEffect(() => {
    setMounted(true);
    useCartStore.persist.rehydrate();
  }, []);

  // Animation lors de l'ajout
  useEffect(() => {
    if (mounted && itemCount > 0) {
      setIsAnimating(true);
      const timeout = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [itemCount, mounted]);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" asChild>
        <Link href="/cart">
          <ShoppingCart className="h-5 w-5" />
        </Link>
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="icon" asChild className="relative">
      <Link href="/cart">
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span
            className={cn(
              "absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary",
              "text-xs text-primary-foreground flex items-center justify-center",
              "transition-transform",
              isAnimating && "scale-125"
            )}
          >
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </Link>
    </Button>
  );
}
```

### API Sync Cart

```typescript
// src/app/api/cart/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const cartItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().positive(),
});

const syncCartSchema = z.object({
  items: z.array(cartItemSchema),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const body = await request.json();
    const { items } = syncCartSchema.parse(body);

    // Recuperer le panier serveur existant
    const existingCart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: true },
    });

    if (!existingCart) {
      // Creer un nouveau panier
      const cart = await prisma.cart.create({
        data: {
          userId: session.user.id,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
            })),
          },
        },
        include: { items: { include: { product: true, variant: true } } },
      });

      return NextResponse.json({ cart });
    }

    // Fusionner les paniers
    for (const item of items) {
      const existing = existingCart.items.find(
        (i) => i.productId === item.productId && i.variantId === item.variantId
      );

      if (existing) {
        // Incrementer la quantite
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + item.quantity },
        });
      } else {
        // Ajouter nouvel item
        await prisma.cartItem.create({
          data: {
            cartId: existingCart.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          },
        });
      }
    }

    // Retourner le panier mis a jour
    const updatedCart = await prisma.cart.findUnique({
      where: { id: existingCart.id },
      include: { items: { include: { product: true, variant: true } } },
    });

    return NextResponse.json({ cart: updatedCart });
  } catch (error) {
    console.error("Sync cart error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la synchronisation" },
      { status: 500 }
    );
  }
}
```

### References

- [Source: architecture.md#Orders Module]
- [Source: prd.md#FR30]
- [Source: epics.md#Story 7.1]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
