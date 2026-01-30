import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import { stripe } from '@/lib/stripe/client';
import { PrismaReturnRepository } from '@/modules/returns/infrastructure/repositories';
import { RefundReturnUseCase } from '@/modules/returns/application/use-cases';

const returnRepository = new PrismaReturnRepository(prisma);

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/creator/returns/[id]/refund
 *
 * Process a refund for a received return.
 * This will trigger the Stripe refund and mark the return as refunded.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    // Check if user is a creator
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Acces reserve aux createurs' }, { status: 403 });
    }

    const { id } = await params;

    // Get return request first to get order details
    const returnRequest = await returnRepository.findById(id);
    if (!returnRequest) {
      return NextResponse.json({ error: 'Demande de retour non trouvee' }, { status: 404 });
    }

    // Get order for payment intent
    const order = await prisma.order.findUnique({
      where: { id: returnRequest.orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvee' }, { status: 404 });
    }

    if (!order.stripePaymentIntentId) {
      return NextResponse.json(
        { error: 'Impossible de rembourser: paiement non trouve' },
        { status: 400 }
      );
    }

    // Process Stripe refund
    let stripeRefund;
    try {
      stripeRefund = await stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
        reason: 'requested_by_customer',
        metadata: {
          returnId: id,
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
      });
    } catch (stripeError) {
      console.error('Stripe refund error:', stripeError);
      return NextResponse.json(
        { error: 'Erreur lors du remboursement Stripe' },
        { status: 500 }
      );
    }

    // Update return status
    const useCase = new RefundReturnUseCase(returnRepository);
    const result = await useCase.execute({
      returnId: id,
      creatorId: session.user.id,
    });

    if (result.isFailure) {
      // Stripe refund succeeded but our DB update failed
      // This should be handled with a reconciliation process
      console.error('Return status update failed after Stripe refund:', result.error);
      return NextResponse.json(
        { error: 'Remboursement Stripe effectue mais mise a jour du statut echouee' },
        { status: 500 }
      );
    }

    // Update order status and store refund ID
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'REFUNDED',
        stripeRefundId: stripeRefund.id,
      },
    });

    return NextResponse.json({
      ...result.value,
      stripeRefundId: stripeRefund.id,
      refundAmount: order.totalAmount,
    });
  } catch (error) {
    console.error('Refund return error:', error);
    return NextResponse.json({ error: 'Erreur lors du remboursement' }, { status: 500 });
  }
}
