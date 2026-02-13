import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { requireCreatorAuth, type RouteIdParams } from '@/lib/api/require-auth';
import { PrismaReturnRepository } from '@/modules/returns/infrastructure/repositories';
import { ReceiveReturnUseCase } from '@/modules/returns/application/use-cases';

const returnRepository = new PrismaReturnRepository(prisma);

export async function POST(_request: NextRequest, { params }: RouteIdParams) {
  try {
    const authResult = await requireCreatorAuth();
    if (!authResult.success) return authResult.response;

    const { id } = await params;
    const useCase = new ReceiveReturnUseCase(returnRepository);

    const result = await useCase.execute({
      returnId: id,
      creatorId: authResult.user.id,
    });

    if (result.isFailure) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

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
