import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import { PrismaReturnRepository } from '@/modules/returns/infrastructure/repositories';
import { CreateReturnUseCase } from '@/modules/returns/application/use-cases';
import type { ReturnReasonValue } from '@/modules/returns/domain/value-objects/return-reason.vo';

const returnRepository = new PrismaReturnRepository(prisma);

/**
 * POST /api/returns
 *
 * Create a new return request for an order.
 * Only customers can create returns for their delivered orders within 14 days.
 *
 * Body:
 * - orderId: string (required)
 * - reason: ReturnReasonValue (required)
 * - reasonDetails?: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, reason, reasonDetails } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID requis' }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json({ error: 'Raison du retour requise' }, { status: 400 });
    }

    // Fetch the order to validate ownership and get details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvee' }, { status: 404 });
    }

    // Check if user owns this order
    if (order.customerId !== session.user.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    // Check if order is delivered
    if (order.status !== 'DELIVERED' && order.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Les retours ne sont possibles que pour les commandes livrees' },
        { status: 400 }
      );
    }

    if (!order.deliveredAt) {
      return NextResponse.json(
        { error: 'Date de livraison non disponible' },
        { status: 400 }
      );
    }

    const useCase = new CreateReturnUseCase(returnRepository);

    const result = await useCase.execute({
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: session.user.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      creatorId: order.creatorId,
      reason: reason as ReturnReasonValue,
      reasonDetails,
      deliveredAt: order.deliveredAt,
    });

    if (result.isFailure) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'VALIDATION_PENDING' },
    });

    return NextResponse.json(result.value, { status: 201 });
  } catch (error) {
    console.error('Create return error:', error);
    return NextResponse.json({ error: 'Erreur lors de la creation du retour' }, { status: 500 });
  }
}

/**
 * GET /api/returns
 *
 * Get return requests for the authenticated customer.
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const skip = (page - 1) * limit;

    const { returns, total } = await returnRepository.findByCustomerId(
      session.user.id,
      { skip, take: limit }
    );

    return NextResponse.json({
      returns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List returns error:', error);
    return NextResponse.json({ error: 'Erreur lors de la recuperation des retours' }, { status: 500 });
  }
}
