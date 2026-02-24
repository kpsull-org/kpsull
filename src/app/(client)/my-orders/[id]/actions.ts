'use server';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import { stripe } from '@/lib/stripe/client';
import { PrismaOrderRepository } from '@/modules/orders/infrastructure/repositories/prisma-order.repository';
import { PrismaReturnRepository } from '@/modules/returns/infrastructure/repositories/prisma-return.repository';
import { CancelOrderUseCase } from '@/modules/orders/application/use-cases/cancel-order.use-case';
import type { DisputeTypeValue } from '@/modules/disputes/domain';
import type { ReturnReasonValue } from '@/modules/returns/domain';
import type { ReturnRequest, ReturnItem } from '@/modules/returns/application/ports/return.repository.interface';

/**
 * Server action to create a dispute for an order
 */
export async function createDispute(
  orderId: string,
  _type: DisputeTypeValue,
  _description: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: 'Non authentifie' };
    }

    const orderRepository = new PrismaOrderRepository(prisma);
    const order = await orderRepository.findById(orderId);

    if (!order) {
      return { success: false, error: 'Commande non trouvee' };
    }

    if (order.customerId !== session.user.id) {
      return { success: false, error: 'Non autorise' };
    }

    if (order.status.value !== 'DELIVERED') {
      return { success: false, error: 'Seules les commandes livrees peuvent faire objet de litige' };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'DISPUTE_OPENED' },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to create dispute:', error);
    return { success: false, error: 'Une erreur est survenue' };
  }
}

/**
 * Server action to request a return for an order (full or partial)
 */
export async function requestReturn(
  orderId: string,
  reason: ReturnReasonValue,
  returnItems?: ReturnItem[],
  additionalNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: 'Non authentifie' };
    }

    const orderRepository = new PrismaOrderRepository(prisma);
    const order = await orderRepository.findById(orderId);

    if (!order) {
      return { success: false, error: 'Commande non trouvee' };
    }

    if (order.customerId !== session.user.id) {
      return { success: false, error: 'Non autorise' };
    }

    if (order.status.value !== 'DELIVERED') {
      return { success: false, error: 'Seules les commandes livrees peuvent faire objet de retour' };
    }

    if (!order.deliveredAt) {
      return { success: false, error: 'Date de livraison inconnue' };
    }

    const deliveryDate = new Date(order.deliveredAt);
    const deadline = new Date(deliveryDate);
    deadline.setDate(deadline.getDate() + 14);

    if (new Date() > deadline) {
      return { success: false, error: 'Le delai de retour de 14 jours est depasse' };
    }

    const returnRepository = new PrismaReturnRepository(prisma);
    const existingReturn = await returnRepository.findByOrderId(orderId);

    if (existingReturn) {
      return { success: false, error: 'Une demande de retour existe deja pour cette commande' };
    }

    const now = new Date();
    const returnRequest: ReturnRequest = {
      id: `return-${Date.now()}`,
      orderId,
      orderNumber: order.orderNumber,
      creatorId: order.creatorId,
      customerId: session.user.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      reason,
      reasonDetails: additionalNotes,
      status: 'REQUESTED',
      returnItems: returnItems && returnItems.length > 0 ? returnItems : undefined,
      createdAt: now,
      updatedAt: now,
    };

    await returnRepository.save(returnRequest);

    return { success: true };
  } catch (error) {
    console.error('Failed to request return:', error);
    return { success: false, error: 'Une erreur est survenue' };
  }
}

/**
 * Server action to cancel a PAID order and trigger Stripe refund
 */
export async function cancelOrderAction(
  orderId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: 'Non authentifie' };
    }

    if (!reason?.trim()) {
      return { success: false, error: "La raison d'annulation est requise" };
    }

    const orderRepository = new PrismaOrderRepository(prisma);
    const order = await orderRepository.findById(orderId);

    if (!order) {
      return { success: false, error: 'Commande non trouvee' };
    }

    if (order.customerId !== session.user.id) {
      return { success: false, error: 'Non autorise' };
    }

    if (order.status.value !== 'PAID') {
      return {
        success: false,
        error: 'Seules les commandes payees peuvent etre annulees',
      };
    }

    // Remboursement Stripe automatique
    if (order.stripePaymentIntentId) {
      await stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
      });
    }

    // Annuler la commande via use case (restitue aussi le stock)
    // Le use case vérifie creatorId — on passe order.creatorId car la vérification
    // client a déjà été faite ci-dessus (order.customerId === session.user.id)
    const cancelUseCase = new CancelOrderUseCase(orderRepository);
    const cancelResult = await cancelUseCase.execute({
      orderId,
      creatorId: order.creatorId,
      reason: reason.trim(),
    });

    if (cancelResult.isFailure) {
      return { success: false, error: cancelResult.error };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to cancel order:', error);
    return { success: false, error: 'Une erreur est survenue' };
  }
}
