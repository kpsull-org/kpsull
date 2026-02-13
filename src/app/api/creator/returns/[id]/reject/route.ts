import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { requireCreatorAuth, type RouteIdParams } from '@/lib/api/require-auth';
import { PrismaReturnRepository } from '@/modules/returns/infrastructure/repositories';
import { RejectReturnUseCase } from '@/modules/returns/application/use-cases';

const returnRepository = new PrismaReturnRepository(prisma);

export async function POST(request: NextRequest, { params }: RouteIdParams) {
  try {
    const authResult = await requireCreatorAuth();
    if (!authResult.success) return authResult.response;

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason?.trim()) {
      return NextResponse.json({ error: 'Raison du rejet requise' }, { status: 400 });
    }

    const useCase = new RejectReturnUseCase(returnRepository);

    const result = await useCase.execute({
      returnId: id,
      creatorId: authResult.user.id,
      reason,
    });

    if (result.isFailure) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

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
