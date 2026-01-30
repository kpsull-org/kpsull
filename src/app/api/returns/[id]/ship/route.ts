import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import { PrismaReturnRepository } from '@/modules/returns/infrastructure/repositories';
import { ShipBackReturnUseCase } from '@/modules/returns/application/use-cases';

const returnRepository = new PrismaReturnRepository(prisma);

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/returns/[id]/ship
 *
 * Mark a return as shipped back by the customer with tracking info.
 * Only the customer who created the return can perform this action.
 *
 * Body:
 * - trackingNumber: string (required)
 * - carrier: string (required)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { trackingNumber, carrier } = body;

    if (!trackingNumber?.trim()) {
      return NextResponse.json({ error: 'Numero de suivi requis' }, { status: 400 });
    }

    if (!carrier?.trim()) {
      return NextResponse.json({ error: 'Transporteur requis' }, { status: 400 });
    }

    const useCase = new ShipBackReturnUseCase(returnRepository);

    const result = await useCase.execute({
      returnId: id,
      customerId: session.user.id,
      trackingNumber,
      carrier,
    });

    if (result.isFailure) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Update order status
    const returnRequest = await returnRepository.findById(id);
    if (returnRequest) {
      await prisma.order.update({
        where: { id: returnRequest.orderId },
        data: { status: 'RETURN_SHIPPED' },
      });
    }

    return NextResponse.json(result.value);
  } catch (error) {
    console.error('Ship return error:', error);
    return NextResponse.json({ error: 'Erreur lors de lexpedition du retour' }, { status: 500 });
  }
}
