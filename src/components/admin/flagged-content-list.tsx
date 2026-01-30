'use client';

import { useState, useTransition } from 'react';
import {
  AlertTriangle,
  Check,
  EyeOff,
  Trash2,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  MessageSquare,
  FileText,
  History,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { FlagReasonValue } from '@/modules/moderation/domain/value-objects/flag-reason.vo';
import { FLAG_REASON_LABELS } from '@/modules/moderation/domain/value-objects/flag-reason.vo';
import type { ModerationStatusValue } from '@/modules/moderation/domain/value-objects/moderation-status.vo';
import { MODERATION_STATUS_LABELS } from '@/modules/moderation/domain/value-objects/moderation-status.vo';
import type { ModerationActionValue } from '@/modules/moderation/domain/value-objects/moderation-action.vo';
import { MODERATION_ACTION_LABELS } from '@/modules/moderation/domain/value-objects/moderation-action.vo';

export interface FlaggedContentItem {
  id: string;
  contentId: string;
  contentType: 'PRODUCT' | 'REVIEW' | 'PAGE';
  contentTitle: string;
  contentDescription?: string;
  contentImageUrl?: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  flaggedBy: string;
  flagReason: FlagReasonValue;
  flagDetails?: string;
  status: ModerationStatusValue;
  moderatorId?: string;
  moderatorNote?: string;
  flaggedAt: Date;
  moderatedAt?: Date;
}

export interface ModerationActionItem {
  id: string;
  flaggedContentId: string;
  contentTitle: string;
  contentType: 'PRODUCT' | 'REVIEW' | 'PAGE';
  action: ModerationActionValue;
  moderatorId: string;
  moderatorName: string;
  moderatorEmail: string;
  note?: string;
  createdAt: Date;
}

export interface FlaggedContentListProps {
  /** List of flagged content items */
  items: FlaggedContentItem[];
  /** Total number of items */
  total: number;
  /** Current page */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total pages */
  totalPages: number;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Current status filter */
  statusFilter?: ModerationStatusValue | 'ALL';
  /** Callback when status filter changes */
  onStatusFilterChange?: (status: ModerationStatusValue | 'ALL') => void;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Callback when moderation action is taken */
  onModerate?: (
    contentId: string,
    action: ModerationActionValue,
    note?: string
  ) => Promise<{ success: boolean; error?: string }>;
  /** Optional className */
  className?: string;
}

export interface ModerationHistoryProps {
  /** List of moderation actions */
  actions: ModerationActionItem[];
  /** Total number of actions */
  total: number;
  /** Current page */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total pages */
  totalPages: number;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Optional className */
  className?: string;
}

const STATUS_BADGE_VARIANTS: Record<
  ModerationStatusValue,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  PENDING: 'secondary',
  APPROVED: 'default',
  HIDDEN: 'outline',
  DELETED: 'destructive',
};

const CONTENT_TYPE_ICONS: Record<'PRODUCT' | 'REVIEW' | 'PAGE', typeof Package> = {
  PRODUCT: Package,
  REVIEW: MessageSquare,
  PAGE: FileText,
};

const CONTENT_TYPE_LABELS: Record<'PRODUCT' | 'REVIEW' | 'PAGE', string> = {
  PRODUCT: 'Produit',
  REVIEW: 'Avis',
  PAGE: 'Page',
};

/**
 * Format date to localized string
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Format relative date
 */
function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) {
    return "Il y a moins d'une heure";
  }
  if (hours < 24) {
    return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  }
  if (days < 7) {
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  }
  return formatDate(date);
}

/**
 * Single flagged content row with inline actions
 */
function FlaggedContentRow({
  item,
  onModerate,
}: {
  item: FlaggedContentItem;
  onModerate?: (
    contentId: string,
    action: ModerationActionValue,
    note?: string
  ) => Promise<{ success: boolean; error?: string }>;
}) {
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ModerationActionValue | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const ContentIcon = CONTENT_TYPE_ICONS[item.contentType];
  const isPendingStatus = item.status === 'PENDING';

  const handleAction = (action: ModerationActionValue) => {
    if (action === 'DELETE') {
      setSelectedAction(action);
      setShowNoteForm(true);
    } else {
      executeAction(action);
    }
  };

  const executeAction = (action: ModerationActionValue, actionNote?: string) => {
    setError(null);
    startTransition(async () => {
      const result = await onModerate?.(item.id, action, actionNote);
      if (result && !result.success) {
        setError(result.error ?? "Une erreur s'est produite");
      } else {
        setShowNoteForm(false);
        setNote('');
        setSelectedAction(null);
      }
    });
  };

  const handleSubmitWithNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAction) {
      executeAction(selectedAction, note.trim() || undefined);
    }
  };

  return (
    <div
      className={cn(
        'border rounded-lg p-4 space-y-3',
        isPendingStatus && 'border-warning bg-warning/5'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {item.contentImageUrl ? (
            <div className="h-12 w-12 rounded-md bg-muted overflow-hidden flex-shrink-0">
              <img
                src={item.contentImageUrl}
                alt={item.contentTitle}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
              <ContentIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium truncate">{item.contentTitle}</h4>
              <Badge variant="outline" className="text-xs">
                {CONTENT_TYPE_LABELS[item.contentType]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <User className="h-3 w-3" />
              {item.creatorName} ({item.creatorEmail})
            </p>
          </div>
        </div>
        <Badge variant={STATUS_BADGE_VARIANTS[item.status]}>
          {MODERATION_STATUS_LABELS[item.status]}
        </Badge>
      </div>

      {/* Flag reason */}
      <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50">
        <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{FLAG_REASON_LABELS[item.flagReason]}</p>
          {item.flagDetails && (
            <p className="text-sm text-muted-foreground mt-1">{item.flagDetails}</p>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Signale {formatRelativeDate(item.flaggedAt)}
        </span>
        {item.moderatedAt && (
          <span>Modere le {formatDate(item.moderatedAt)}</span>
        )}
      </div>

      {/* Moderator note if exists */}
      {item.moderatorNote && !isPendingStatus && (
        <div className="text-sm p-2 rounded bg-muted">
          <span className="font-medium">Note du moderateur:</span> {item.moderatorNote}
        </div>
      )}

      {/* Error display */}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </p>
      )}

      {/* Actions for pending items */}
      {isPendingStatus && (
        <div className="pt-2 space-y-3">
          {!showNoteForm ? (
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleAction('APPROVE')}
                disabled={isPending}
                size="sm"
                variant="default"
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
                onClick={() => handleAction('HIDE')}
                disabled={isPending}
                size="sm"
                variant="outline"
              >
                <EyeOff className="h-4 w-4" />
                Masquer
              </Button>
              <Button
                onClick={() => handleAction('DELETE')}
                disabled={isPending}
                size="sm"
                variant="destructive"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitWithNote} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor={`note-${item.id}`}>
                  Note de moderation (optionnel)
                </Label>
                <textarea
                  id={`note-${item.id}`}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Expliquez la raison de cette action..."
                  disabled={isPending}
                  className={cn(
                    'flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none'
                  )}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isPending}
                  variant="destructive"
                  size="sm"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Confirmer la suppression
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowNoteForm(false);
                    setNote('');
                    setSelectedAction(null);
                    setError(null);
                  }}
                  disabled={isPending}
                  variant="ghost"
                  size="sm"
                >
                  Annuler
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * FlaggedContentList Component
 *
 * Story 11-5: Controle contenu
 *
 * Displays a list of flagged content with moderation actions.
 *
 * Acceptance Criteria:
 * - AC1: Liste des produits signales (mock data)
 * - AC2: Actions: Approuver, Masquer, Supprimer
 */
export function FlaggedContentList({
  items,
  total,
  page,
  pageSize,
  totalPages,
  isLoading = false,
  statusFilter = 'ALL',
  onStatusFilterChange,
  onPageChange,
  onModerate,
  className,
}: FlaggedContentListProps) {
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);

  const statusOptions: Array<{ value: ModerationStatusValue | 'ALL'; label: string }> = [
    { value: 'ALL', label: 'Tous' },
    { value: 'PENDING', label: 'En attente' },
    { value: 'APPROVED', label: 'Approuves' },
    { value: 'HIDDEN', label: 'Masques' },
    { value: 'DELETED', label: 'Supprimes' },
  ];

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Contenus signales
            </CardTitle>
            <CardDescription>
              {total} contenu{total !== 1 ? 's' : ''} signale{total !== 1 ? 's' : ''}
            </CardDescription>
          </div>

          {/* Status filter */}
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                variant={statusFilter === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onStatusFilterChange?.(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Check className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Aucun contenu signale</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {statusFilter !== 'ALL'
                ? `Aucun contenu avec le statut "${MODERATION_STATUS_LABELS[statusFilter as ModerationStatusValue]}".`
                : 'Aucun contenu n\'a ete signale pour le moment.'}
            </p>
          </div>
        )}

        {/* Content list */}
        {!isLoading && items.length > 0 && (
          <>
            <div className="space-y-4">
              {items.map((item) => (
                <FlaggedContentRow key={item.id} item={item} onModerate={onModerate} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Affichage de {startIndex} a {endIndex} sur {total}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Precedent
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {page} sur {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(page + 1)}
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

/**
 * ModerationHistory Component
 *
 * Story 11-5: Controle contenu - AC3: Historique des actions
 *
 * Displays a list of past moderation actions.
 */
export function ModerationHistory({
  actions,
  total,
  page,
  pageSize,
  totalPages,
  isLoading = false,
  onPageChange,
  className,
}: ModerationHistoryProps) {
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);

  const ACTION_COLORS: Record<ModerationActionValue, string> = {
    APPROVE: 'text-green-600 bg-green-100',
    HIDE: 'text-yellow-600 bg-yellow-100',
    DELETE: 'text-red-600 bg-red-100',
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historique des actions
        </CardTitle>
        <CardDescription>
          {total} action{total !== 1 ? 's' : ''} de moderation
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && actions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <History className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Aucune action</h3>
            <p className="text-sm text-muted-foreground mt-1">
              L'historique des actions de moderation est vide.
            </p>
          </div>
        )}

        {/* Actions list */}
        {!isLoading && actions.length > 0 && (
          <>
            <div className="space-y-3">
              {actions.map((action) => {
                const ContentIcon = CONTENT_TYPE_ICONS[action.contentType];
                return (
                  <div
                    key={action.id}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    <div
                      className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0',
                        ACTION_COLORS[action.action]
                      )}
                    >
                      {action.action === 'APPROVE' && <Check className="h-4 w-4" />}
                      {action.action === 'HIDE' && <EyeOff className="h-4 w-4" />}
                      {action.action === 'DELETE' && <Trash2 className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {MODERATION_ACTION_LABELS[action.action]}
                        </span>
                        <span className="text-muted-foreground">-</span>
                        <span className="truncate">{action.contentTitle}</span>
                        <Badge variant="outline" className="text-xs">
                          <ContentIcon className="h-3 w-3 mr-1" />
                          {CONTENT_TYPE_LABELS[action.contentType]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{action.moderatorName}</span>
                        <span>-</span>
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(action.createdAt)}</span>
                      </div>
                      {action.note && (
                        <p className="text-sm text-muted-foreground mt-2 p-2 rounded bg-muted">
                          {action.note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Affichage de {startIndex} a {endIndex} sur {total}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Precedent
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {page} sur {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(page + 1)}
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
