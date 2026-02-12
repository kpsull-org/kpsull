import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { ListReturnsUseCase } from '@/modules/returns/application/use-cases/list-returns.use-case';
import { ApproveReturnUseCase } from '@/modules/returns/application/use-cases/approve-return.use-case';
import { RejectReturnUseCase } from '@/modules/returns/application/use-cases/reject-return.use-case';
import { ReceiveReturnUseCase } from '@/modules/returns/application/use-cases/receive-return.use-case';
import { RefundReturnUseCase } from '@/modules/returns/application/use-cases/refund-return.use-case';
import { PrismaReturnRepository } from '@/modules/returns/infrastructure/repositories/prisma-return.repository';
import { Card, CardContent } from '@/components/ui/card';
import { ReturnsPageClient } from './page-client';
import type { ReturnStatusValue } from '@/modules/returns/domain/value-objects/return-status.vo';

export const metadata: Metadata = {
  title: 'Demandes de retour | Kpsull',
  description: 'Gerez les demandes de retour de vos clients',
};

interface ReturnsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function ReturnsPage({ searchParams }: ReturnsPageProps) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    redirect('/profile');
  }

  const statusFilter = params.status as ReturnStatusValue | undefined;

  const returnRepository = new PrismaReturnRepository(prisma);
  const listReturnsUseCase = new ListReturnsUseCase(returnRepository);

  const result = await listReturnsUseCase.execute({
    creatorId: session.user.id,
    status: statusFilter,
  });

  if (result.isFailure) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Une erreur est survenue lors du chargement des demandes de retour.
        </CardContent>
      </Card>
    );
  }

  const { returns, total } = result.value;

  const statusCounts = {
    REQUESTED: returns.filter((r) => r.status === 'REQUESTED').length,
    APPROVED: returns.filter((r) => r.status === 'APPROVED').length,
    SHIPPED_BACK: returns.filter((r) => r.status === 'SHIPPED_BACK').length,
    RECEIVED: returns.filter((r) => r.status === 'RECEIVED').length,
    REFUNDED: returns.filter((r) => r.status === 'REFUNDED').length,
    REJECTED: returns.filter((r) => r.status === 'REJECTED').length,
  };

  async function approveReturn(returnId: string) {
    'use server';

    const currentSession = await auth();
    if (!currentSession?.user) {
      return { success: false, error: 'Non authentifie' };
    }

    const repository = new PrismaReturnRepository(prisma);
    const useCase = new ApproveReturnUseCase(repository);

    const approveResult = await useCase.execute({
      returnId,
      creatorId: currentSession.user.id,
    });

    if (approveResult.isFailure) {
      return { success: false, error: approveResult.error };
    }

    return { success: true };
  }

  async function rejectReturn(returnId: string, reason: string) {
    'use server';

    const currentSession = await auth();
    if (!currentSession?.user) {
      return { success: false, error: 'Non authentifie' };
    }

    const repository = new PrismaReturnRepository(prisma);
    const useCase = new RejectReturnUseCase(repository);

    const rejectResult = await useCase.execute({
      returnId,
      creatorId: currentSession.user.id,
      reason,
    });

    if (rejectResult.isFailure) {
      return { success: false, error: rejectResult.error };
    }

    return { success: true };
  }

  async function receiveReturn(returnId: string) {
    'use server';

    const currentSession = await auth();
    if (!currentSession?.user) {
      return { success: false, error: 'Non authentifie' };
    }

    const repository = new PrismaReturnRepository(prisma);
    const useCase = new ReceiveReturnUseCase(repository);

    const receiveResult = await useCase.execute({
      returnId,
      creatorId: currentSession.user.id,
    });

    if (receiveResult.isFailure) {
      return { success: false, error: receiveResult.error };
    }

    return { success: true };
  }

  async function refundReturn(returnId: string) {
    'use server';

    const currentSession = await auth();
    if (!currentSession?.user) {
      return { success: false, error: 'Non authentifie' };
    }

    const repository = new PrismaReturnRepository(prisma);
    const useCase = new RefundReturnUseCase(repository);

    const refundResult = await useCase.execute({
      returnId,
      creatorId: currentSession.user.id,
    });

    if (refundResult.isFailure) {
      return { success: false, error: refundResult.error };
    }

    return { success: true };
  }

  const transformedReturns = returns.map((r) => ({
    ...r,
    createdAt: new Date(r.createdAt),
    refundAmount: 0,
  }));

  return (
    <ReturnsPageClient
      returns={transformedReturns}
      total={total}
      statusCounts={statusCounts}
      currentFilter={statusFilter}
      onApprove={approveReturn}
      onReject={rejectReturn}
      onReceive={receiveReturn}
      onRefund={refundReturn}
    />
  );
}
