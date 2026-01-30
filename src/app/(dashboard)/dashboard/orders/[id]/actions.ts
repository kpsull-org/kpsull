'use server';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma/client';
import { CancelOrderUseCase } from '@/modules/orders/application';
import { PrismaOrderRepository } from '@/modules/orders/infrastructure/repositories/prisma-order.repository';
import { z } from 'zod';

const orderRepository = new PrismaOrderRepository(prisma);
const cancelOrderUseCase = new CancelOrderUseCase(orderRepository);

// Validation schema
const cancelOrderSchema = z.object({
  orderId: z.string().min(1, 'Order ID est requis'),
  reason: z.string().min(1, "La raison d'annulation est requise"),
});

export interface CancelOrderResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action: Cancel Order
 *
 * Story 8-5: Annulation remboursement
 *
 * Cancels an order with a mandatory reason.
 * Only orders that haven't been shipped can be cancelled.
 *
 * Acceptance Criteria:
 * - AC3: Update status to CANCELLED
 */
export async function cancelOrder(
  orderId: string,
  reason: string
): Promise<CancelOrderResult> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Only creators can cancel orders
  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    return { success: false, error: "Vous n'etes pas autorise a effectuer cette action" };
  }

  // Validate input
  const validationResult = cancelOrderSchema.safeParse({ orderId, reason });
  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return { success: false, error: firstError?.message ?? 'Donnees invalides' };
  }

  // Execute use case
  const result = await cancelOrderUseCase.execute({
    orderId: validationResult.data.orderId,
    creatorId: session.user.id,
    reason: validationResult.data.reason,
  });

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  // Revalidate the orders pages
  revalidatePath('/dashboard/orders');
  revalidatePath(`/dashboard/orders/${orderId}`);

  return { success: true };
}
