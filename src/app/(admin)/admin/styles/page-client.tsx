'use client';

import { useState, useCallback, useEffect, useTransition } from 'react';
import {
  Check,
  X,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Palette,
  History,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { StyleStatus } from '@prisma/client';
import {
  listPendingStylesAction,
  approveStyleAction,
  rejectStyleAction,
  listAllStylesAction,
  type StyleWithCreator,
  type PaginatedStyles,
} from './actions';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

const STATUS_LABELS: Record<StyleStatus, string> = {
  PENDING_APPROVAL: 'En attente',
  APPROVED: 'Approuvé',
  REJECTED: 'Rejeté',
};

const STATUS_BADGE_VARIANTS: Record<
  StyleStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  PENDING_APPROVAL: 'secondary',
  APPROVED: 'default',
  REJECTED: 'destructive',
};

// ─── RejectDialog ────────────────────────────────────────────────────────────

interface RejectDialogProps {
  readonly styleId: string;
  readonly styleName: string;
  readonly onConfirm: (styleId: string, reason: string) => Promise<void>;
  readonly onCancel: () => void;
  readonly isPending: boolean;
}

function RejectDialog({ styleId, styleName, onConfirm, onCancel, isPending }: RejectDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Le motif de rejet est obligatoire');
      return;
    }
    setError(null);
    await onConfirm(styleId, reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg space-y-4">
        <h2 className="text-lg font-semibold">Rejeter le style</h2>
        <p className="text-sm text-muted-foreground">
          Vous allez rejeter le style{' '}
          <span className="font-medium text-foreground">&quot;{styleName}&quot;</span>.
          Le créateur recevra le motif de rejet.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="reject-reason" className="text-sm font-medium">
              Motif de rejet <span className="text-destructive">*</span>
            </label>
            <textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Expliquez pourquoi ce style ne peut pas être approuvé..."
              disabled={isPending}
              rows={3}
              className={cn(
                'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
                error && 'border-destructive'
              )}
            />
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" variant="destructive" size="sm" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <X className="h-4 w-4" />
                  Confirmer le rejet
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── StyleCard ───────────────────────────────────────────────────────────────

interface StyleCardProps {
  readonly style: StyleWithCreator;
  readonly onApprove: (styleId: string) => Promise<void>;
  readonly onReject: (styleId: string, reason: string) => Promise<void>;
}

function StyleCard({ style, onApprove, onReject }: StyleCardProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    setActionError(null);
    startTransition(async () => {
      await onApprove(style.id);
    });
  };

  const handleRejectConfirm = async (styleId: string, reason: string) => {
    startTransition(async () => {
      await onReject(styleId, reason);
      setShowRejectDialog(false);
    });
  };

  return (
    <>
      <div className="border rounded-lg p-4 space-y-3 border-warning bg-warning/5">
        <div className="flex items-start gap-3">
          {style.imageUrl ? (
            <div className="h-16 w-16 rounded-md bg-muted overflow-hidden flex-shrink-0">
              <img
                src={style.imageUrl}
                alt={style.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
              <Palette className="h-7 w-7 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium">{style.name}</h4>
              <Badge variant={STATUS_BADGE_VARIANTS[style.status]}>
                {STATUS_LABELS[style.status]}
              </Badge>
            </div>
            {style.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {style.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              {style.creator && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {style.creator.name ?? style.creator.email} ({style.creator.email})
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(style.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {actionError && (
          <p className="text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {actionError}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="default"
            onClick={handleApprove}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4" />
                Approuver
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowRejectDialog(true)}
            disabled={isPending}
          >
            <X className="h-4 w-4" />
            Rejeter
          </Button>
        </div>
      </div>

      {showRejectDialog && (
        <RejectDialog
          styleId={style.id}
          styleName={style.name}
          onConfirm={handleRejectConfirm}
          onCancel={() => setShowRejectDialog(false)}
          isPending={isPending}
        />
      )}
    </>
  );
}

// ─── HistorySection ──────────────────────────────────────────────────────────

interface HistorySectionProps {
  readonly data: PaginatedStyles;
  readonly isLoading: boolean;
  readonly onPageChange: (page: number) => void;
  readonly statusFilter: StyleStatus | 'ALL';
  readonly onStatusFilterChange: (status: StyleStatus | 'ALL') => void;
}

function HistorySection({
  data,
  isLoading,
  onPageChange,
  statusFilter,
  onStatusFilterChange,
}: HistorySectionProps) {
  const { items, total, page, pageSize, totalPages } = data;
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);

  const statusOptions: Array<{ value: StyleStatus | 'ALL'; label: string }> = [
    { value: 'ALL', label: 'Tous' },
    { value: StyleStatus.APPROVED, label: 'Approuvés' },
    { value: StyleStatus.REJECTED, label: 'Rejetés' },
    { value: StyleStatus.PENDING_APPROVAL, label: 'En attente' },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique des styles
            </CardTitle>
            <CardDescription>
              {total} style{total !== 1 ? 's' : ''} au total
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                variant={statusFilter === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onStatusFilterChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <History className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Aucun style</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Aucun style ne correspond aux critères sélectionnés.
            </p>
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <>
            <div className="space-y-3">
              {items.map((style) => (
                <div key={style.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  {style.imageUrl ? (
                    <div className="h-10 w-10 rounded-md bg-muted overflow-hidden flex-shrink-0">
                      <img
                        src={style.imageUrl}
                        alt={style.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                      <Palette className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{style.name}</span>
                      <Badge variant={STATUS_BADGE_VARIANTS[style.status]}>
                        {STATUS_LABELS[style.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {style.creator && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {style.creator.name ?? style.creator.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(style.createdAt)}
                      </span>
                    </div>
                    {style.rejectionReason && (
                      <p className="text-xs text-muted-foreground mt-1.5 p-2 rounded bg-muted">
                        <span className="font-medium">Motif :</span> {style.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Affichage de {startIndex} à {endIndex} sur {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── StyleModerationClient ───────────────────────────────────────────────────

export function StyleModerationClient() {
  const [pending, setPending] = useState<StyleWithCreator[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  const [history, setHistory] = useState<PaginatedStyles>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
  });
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyStatusFilter, setHistoryStatusFilter] = useState<StyleStatus | 'ALL'>('ALL');

  const loadPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      const result = await listPendingStylesAction();
      if (result.success) {
        setPending(result.data);
      }
    } finally {
      setPendingLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const result = await listAllStylesAction({
        status: historyStatusFilter === 'ALL' ? undefined : historyStatusFilter,
        page: historyPage,
        pageSize: 20,
      });
      if (result.success) {
        setHistory(result.data);
      }
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage, historyStatusFilter]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleApprove = useCallback(
    async (styleId: string) => {
      await approveStyleAction(styleId);
      await Promise.all([loadPending(), loadHistory()]);
    },
    [loadPending, loadHistory]
  );

  const handleReject = useCallback(
    async (styleId: string, reason: string) => {
      await rejectStyleAction(styleId, reason);
      await Promise.all([loadPending(), loadHistory()]);
    },
    [loadPending, loadHistory]
  );

  const handleHistoryStatusFilterChange = useCallback((status: StyleStatus | 'ALL') => {
    setHistoryStatusFilter(status);
    setHistoryPage(1);
  }, []);

  return (
    <>
      {/* En attente de validation */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            En attente de validation
            {pending.length > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                {pending.length > 99 ? '99+' : pending.length}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {pending.length} style{pending.length !== 1 ? 's' : ''} en attente de validation
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {pendingLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {!pendingLoading && pending.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Check className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Tout est à jour</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Aucun style n&apos;est en attente de validation.
              </p>
            </div>
          )}

          {!pendingLoading && pending.length > 0 && (
            <div className="space-y-4">
              {pending.map((style) => (
                <StyleCard
                  key={style.id}
                  style={style}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historique */}
      <HistorySection
        data={history}
        isLoading={historyLoading}
        onPageChange={setHistoryPage}
        statusFilter={historyStatusFilter}
        onStatusFilterChange={handleHistoryStatusFilterChange}
      />
    </>
  );
}
