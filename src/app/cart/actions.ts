'use server';

import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { CartItemSchema } from '@/lib/schemas/checkout.schema';
import type { CartItem } from '@/lib/stores/cart.store';

/**
 * Extended cart item schema that accepts all fields from the Zustand store.
 * CartItemSchema covers the base fields; store-specific fields are added here.
 */
const StoreCartItemSchema = CartItemSchema.extend({
  variantId: z.string().optional(),
  creatorSlug: z.string().min(1),
  variantInfo: z
    .object({
      type: z.string(),
      value: z.string(),
    })
    .optional(),
});

/**
 * Get the authenticated user's cart items from the database.
 * Returns empty array if no cart exists or user is not authenticated.
 */
export async function getCartAction(): Promise<CartItem[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
  });

  if (!cart) return [];

  return cart.items as unknown as CartItem[];
}

/**
 * Save the cart items for the authenticated user.
 * Validates items with Zod before persisting.
 * Creates or replaces the entire cart (upsert).
 */
export async function saveCartAction(
  items: CartItem[]
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Non authentifié' };

  const validation = z.array(StoreCartItemSchema).safeParse(items);
  if (!validation.success) {
    const errorMessage = validation.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    return { success: false, error: `Items invalides: ${errorMessage}` };
  }

  // Serialize validated data to ensure Prisma-compatible plain JSON
  const serializedItems = JSON.parse(JSON.stringify(validation.data));

  await prisma.cart.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      items: serializedItems,
    },
    update: {
      items: serializedItems,
    },
  });

  return { success: true };
}

/**
 * Clear the authenticated user's cart.
 */
export async function clearCartAction(): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  await prisma.cart.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      items: [],
    },
    update: {
      items: [],
    },
  });

  return { success: true };
}
