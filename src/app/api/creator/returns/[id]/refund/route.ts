import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { stripe } from '@/lib/stripe/client';
import { requireCreatorAuth, type RouteIdParams } from '@/lib/api/require-auth';
import { PrismaReturnRepository } from '@/modules/returns/infrastructure/repositories';
import { RefundReturnUseCase } from '@/modules/returns/application/use-cases';

const returnRepository = new PrismaReturnRepository(prisma);

export async function POST(_request: NextRequest, { params }: RouteIdParams) {
  try {
    const authResult = await requireCreatorAuth();
    if (!authResult.success) return authResult.response;

    const { id } = await params;

    const returnRequest = await returnRepository.findById(id);
    if (!returnRequest) {
      return NextResponse.json({ error: 'Demande de retour non trouvee' }, { status: 404 });
    }

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

    const useCase = new RefundReturnUseCase(returnRepository);
    const result = await useCase.execute({
      returnId: id,
      creatorId: authResult.user.id,
    });

    if (result.isFailure) {
      console.error('Return status update failed after Stripe refund:', result.error);
      return NextResponse.json(
        { error: 'Remboursement Stripe effectue mais mise a jour du statut echouee' },
        { status: 500 }
      );
    }

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
