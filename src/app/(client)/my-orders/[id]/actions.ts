'use server';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import { PrismaOrderRepository } from '@/modules/orders/infrastructure/repositories/prisma-order.repository';
import { PrismaReturnRepository } from '@/modules/returns/infrastructure/repositories/prisma-return.repository';
import type { DisputeTypeValue } from '@/modules/disputes/domain';
import type { ReturnReasonValue } from '@/modules/returns/domain';
import type { ReturnRequest } from '@/modules/returns/application/ports/return.repository.interface';

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
 * Server action to request a return for an order
 */
export async function requestReturn(
  orderId: string,
  reason: ReturnReasonValue,
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
