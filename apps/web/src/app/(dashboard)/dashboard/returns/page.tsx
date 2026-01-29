import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Package } from 'lucide-react';
import { auth } from '@/lib/auth';
import { ListReturnsUseCase } from '@/modules/returns/application/use-cases/list-returns.use-case';
import { ApproveReturnUseCase } from '@/modules/returns/application/use-cases/approve-return.use-case';
import { RejectReturnUseCase } from '@/modules/returns/application/use-cases/reject-return.use-case';
import { MockReturnRepository } from '@/modules/returns/infrastructure/repositories/mock-return.repository';
import { ReturnRequestCard } from '@/components/returns/return-request-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Demandes de retour | Kpsull',
  description: 'Gerez les demandes de retour de vos clients',
};

/**
 * Returns Dashboard Page
 *
 * Story 9-5: Validation retour remboursement
 *
 * Page for creators to view and manage return requests.
 *
 * Acceptance Criteria:
 * - AC1: Page createur pour voir les demandes de retour
 * - AC2: Actions: Approuver ou Rejeter avec motif
 * - AC3: Mise a jour statut retour
 * - AC4: Affichage dans dashboard createur
 */
export default async function ReturnsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Only creators and admins can access this page
  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    redirect('/profile');
  }

  const returnRepository = new MockReturnRepository();
  const listReturnsUseCase = new ListReturnsUseCase(returnRepository);

  const result = await listReturnsUseCase.execute({
    creatorId: session.user.id,
  });

  if (result.isFailure) {
    return (
      <div className="container max-w-4xl py-6">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Une erreur est survenue lors du chargement des demandes de retour.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { returns, total } = result.value;

  // Count pending returns
  const pendingCount = returns.filter((r) => r.status === 'REQUESTED').length;

  // Server actions for approve/reject
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

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Demandes de retour
          </h1>
          <p className="text-muted-foreground">
            Gerez les demandes de retour de vos clients
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="secondary" className="text-sm">
            {pendingCount} en attente
          </Badge>
        )}
      </div>

      {/* Return requests list */}
      {returns.length === 0 ? (
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl">Aucune demande de retour</CardTitle>
            <CardDescription>
              Vous n&apos;avez pas encore recu de demandes de retour.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Pending returns first */}
          {returns
            .filter((r) => r.status === 'REQUESTED')
            .map((returnRequest) => (
              <ReturnRequestCard
                key={returnRequest.id}
                returnRequest={{
                  ...returnRequest,
                  createdAt: new Date(returnRequest.createdAt),
                  approvedAt: returnRequest.approvedAt
                    ? new Date(returnRequest.approvedAt)
                    : undefined,
                  rejectedAt: returnRequest.rejectedAt
                    ? new Date(returnRequest.rejectedAt)
                    : undefined,
                }}
                onApprove={approveReturn}
                onReject={rejectReturn}
              />
            ))}

          {/* Processed returns */}
          {returns.filter((r) => r.status !== 'REQUESTED').length > 0 && (
            <>
              <div className="pt-4 pb-2">
                <h2 className="text-lg font-semibold text-muted-foreground">
                  Demandes traitees
                </h2>
              </div>
              {returns
                .filter((r) => r.status !== 'REQUESTED')
                .map((returnRequest) => (
                  <ReturnRequestCard
                    key={returnRequest.id}
                    returnRequest={{
                      ...returnRequest,
                      createdAt: new Date(returnRequest.createdAt),
                      approvedAt: returnRequest.approvedAt
                        ? new Date(returnRequest.approvedAt)
                        : undefined,
                      rejectedAt: returnRequest.rejectedAt
                        ? new Date(returnRequest.rejectedAt)
                        : undefined,
                    }}
                    onApprove={approveReturn}
                    onReject={rejectReturn}
                  />
                ))}
            </>
          )}

          {/* Pagination info */}
          <p className="text-sm text-center text-muted-foreground pt-4">
            {total} demande{total > 1 ? 's' : ''} de retour au total
          </p>
        </div>
      )}
    </div>
  );
}
