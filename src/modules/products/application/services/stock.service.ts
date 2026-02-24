import prisma from '@/lib/prisma/client';

export interface StockItem {
  variantId?: string;
  quantity: number;
}

/**
 * Incrémente le stock des variantes lors d'une annulation ou d'un retour.
 * Seuls les items avec un variantId sont traités.
 */
export async function incrementStock(items: StockItem[]): Promise<void> {
  const itemsWithVariant = items.filter((item) => item.variantId);
  if (itemsWithVariant.length === 0) return;

  await prisma.$transaction(
    itemsWithVariant.map((item) =>
      prisma.productVariant.update({
        where: { id: item.variantId! },
        data: { stock: { increment: item.quantity } },
      })
    )
  );
}

/**
 * Décrémente le stock des variantes lors d'une commande.
 * Seuls les items avec un variantId sont traités.
 */
export async function decrementStock(items: StockItem[]): Promise<void> {
  const itemsWithVariant = items.filter((item) => item.variantId);
  if (itemsWithVariant.length === 0) return;

  await prisma.$transaction(
    itemsWithVariant.map((item) =>
      prisma.productVariant.update({
        where: { id: item.variantId! },
        data: { stock: { decrement: item.quantity } },
      })
    )
  );
}
