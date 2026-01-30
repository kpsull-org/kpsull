import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import { PrismaReturnRepository } from '@/modules/returns/infrastructure/repositories';
import { RejectReturnUseCase } from '@/modules/returns/application/use-cases';

const returnRepository = new PrismaReturnRepository(prisma);

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/creator/returns/[id]/reject
 *
 * Reject a return request with a reason.
 * Only the creator who received the order can reject.
 *
 * Body:
 * - reason: string (required) - Reason for rejection
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
    const body = await request.json();
    const { reason } = body;

    if (!reason?.trim()) {
      return NextResponse.json({ error: 'Raison du rejet requise' }, { status: 400 });
    }

    const useCase = new RejectReturnUseCase(returnRepository);

    const result = await useCase.execute({
      returnId: id,
      creatorId: session.user.id,
      reason,
    });

    if (result.isFailure) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Update order status back to DELIVERED
    const returnRequest = await returnRepository.findById(id);
    if (returnRequest) {
      await prisma.order.update({
        where: { id: returnRequest.orderId },
        data: { status: 'DELIVERED' },
      });
    }

    return NextResponse.json(result.value);
  } catch (error) {
    console.error('Reject return error:', error);
    return NextResponse.json({ error: 'Erreur lors du rejet du retour' }, { status: 500 });
  }
}
