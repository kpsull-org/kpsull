import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ListReturnsUseCase } from '@/modules/returns/application/use-cases/list-returns.use-case';
import { ApproveReturnUseCase } from '@/modules/returns/application/use-cases/approve-return.use-case';
import { RejectReturnUseCase } from '@/modules/returns/application/use-cases/reject-return.use-case';
import { MockReturnRepository } from '@/modules/returns/infrastructure/repositories/mock-return.repository';
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

/**
 * Returns Dashboard Page
 *
 * Story 9-5: Validation retour remboursement
 *
 * Page for creators to view and manage return requests.
 * Enhanced with table view and status filtering.
 *
 * Acceptance Criteria:
 * - AC1: Page createur pour voir les demandes de retour
 * - AC2: Actions: Approuver ou Rejeter avec motif
 * - AC3: Mise a jour statut retour
 * - AC4: Affichage dans dashboard createur
 */
export default async function ReturnsPage({ searchParams }: ReturnsPageProps) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user) {
    redirect('/login');
  }

  // Only creators and admins can access this page
  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    redirect('/profile');
  }

  const statusFilter = params.status as ReturnStatusValue | undefined;

  const returnRepository = new MockReturnRepository();
  const listReturnsUseCase = new ListReturnsUseCase(returnRepository);

  const result = await listReturnsUseCase.execute({
    creatorId: session.user.id,
    status: statusFilter,
  });

  if (result.isFailure) {
    return (
      <div className="container max-w-6xl py-6">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Une erreur est survenue lors du chargement des demandes de retour.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { returns, total } = result.value;

  // Count by status for filter badges
  const statusCounts = {
    REQUESTED: returns.filter((r) => r.status === 'REQUESTED').length,
    APPROVED: returns.filter((r) => r.status === 'APPROVED').length,
    SHIPPED_BACK: returns.filter((r) => r.status === 'SHIPPED_BACK').length,
    RECEIVED: returns.filter((r) => r.status === 'RECEIVED').length,
    REFUNDED: returns.filter((r) => r.status === 'REFUNDED').length,
    REJECTED: returns.filter((r) => r.status === 'REJECTED').length,
  };

  // Server actions
  async function approveReturn(returnId: string) {
    'use server';

    const currentSession = await auth();
    if (!currentSession?.user) {
      return { success: false, error: 'Non authentifie' };
    }

    const repository = new MockReturnRepository();
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

    const repository = new MockReturnRepository();
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

  async function receiveReturn(_returnId: string) {
    'use server';

    const currentSession = await auth();
    if (!currentSession?.user) {
      return { success: false, error: 'Non authentifie' };
    }

    // TODO: Implement ReceiveReturnUseCase
    // For now, return success (mock)
    return { success: true };
  }

  async function refundReturn(_returnId: string) {
    'use server';

    const currentSession = await auth();
    if (!currentSession?.user) {
      return { success: false, error: 'Non authentifie' };
    }

    // TODO: Implement RefundReturnUseCase
    // For now, return success (mock)
    return { success: true };
  }

  // Transform returns for the client component
  // Note: refundAmount is set to 0 as placeholder - in production,
  // this would come from the order total or a dedicated field
  const transformedReturns = returns.map((r) => ({
    ...r,
    createdAt: new Date(r.createdAt),
    refundAmount: 0, // TODO: Get actual refund amount from order
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
