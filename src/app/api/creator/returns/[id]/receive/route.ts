import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import { PrismaReturnRepository } from '@/modules/returns/infrastructure/repositories';
import { ReceiveReturnUseCase } from '@/modules/returns/application/use-cases';

const returnRepository = new PrismaReturnRepository(prisma);

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/creator/returns/[id]/receive
 *
 * Mark a return as received by the creator.
 * The item has been shipped back and the creator confirms receipt.
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

    const useCase = new ReceiveReturnUseCase(returnRepository);

    const result = await useCase.execute({
      returnId: id,
      creatorId: session.user.id,
    });

    if (result.isFailure) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Update order status
    const returnRequest = await returnRepository.findById(id);
    if (returnRequest) {
      await prisma.order.update({
        where: { id: returnRequest.orderId },
        data: { status: 'RETURN_RECEIVED' },
      });
    }

    return NextResponse.json(result.value);
  } catch (error) {
    console.error('Receive return error:', error);
    return NextResponse.json({ error: 'Erreur lors de la confirmation de reception' }, { status: 500 });
  }
}
