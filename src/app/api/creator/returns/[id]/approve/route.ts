import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import { PrismaReturnRepository } from '@/modules/returns/infrastructure/repositories';
import { ApproveReturnUseCase } from '@/modules/returns/application/use-cases';

const returnRepository = new PrismaReturnRepository(prisma);

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/creator/returns/[id]/approve
 *
 * Approve a return request. Only the creator who received the order can approve.
 * After approval, the customer can ship the item back.
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

    const useCase = new ApproveReturnUseCase(returnRepository);

    const result = await useCase.execute({
      returnId: id,
      creatorId: session.user.id,
    });

    if (result.isFailure) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.value);
  } catch (error) {
    console.error('Approve return error:', error);
    return NextResponse.json({ error: 'Erreur lors de lapprobation du retour' }, { status: 500 });
  }
}
