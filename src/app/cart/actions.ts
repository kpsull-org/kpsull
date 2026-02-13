'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import type { CartItem } from '@/lib/stores/cart.store';

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
 * Creates or replaces the entire cart (upsert).
 */
export async function saveCartAction(
  items: CartItem[]
): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  // JSON.parse(JSON.stringify(...)) ensures plain JSON compatible with Prisma
  // (strips class prototypes and non-serializable properties)
  const serializedItems = JSON.parse(JSON.stringify(items));

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
