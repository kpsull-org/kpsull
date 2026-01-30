'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  FlaggedContentList,
  ModerationHistory,
  type FlaggedContentItem,
  type ModerationActionItem,
} from '@/components/admin/flagged-content-list';
import { MockModerationRepository } from '@/modules/moderation/infrastructure/repositories/mock-moderation.repository';
import type { ModerationStatusValue } from '@/modules/moderation/domain/value-objects/moderation-status.vo';
import type { ModerationActionValue } from '@/modules/moderation/domain/value-objects/moderation-action.vo';

/**
 * Admin Moderation Page
 *
 * Story 11-5: Controle contenu
 *
 * Page for administrators to manage flagged content.
 *
 * Acceptance Criteria:
 * - AC1: Liste des produits signales (mock data)
 * - AC2: Actions: Approuver, Masquer, Supprimer
 * - AC3: Historique des actions de moderation
 */
export default function ModerationPage() {
  // Repository instance (in production, this would come from DI)
  const [repository] = useState(() => new MockModerationRepository());

  // Flagged content state
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContentItem[]>([]);
  const [flaggedTotal, setFlaggedTotal] = useState(0);
  const [flaggedPage, setFlaggedPage] = useState(1);
  const [flaggedTotalPages, setFlaggedTotalPages] = useState(1);
  const [flaggedLoading, setFlaggedLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ModerationStatusValue | 'ALL'>('PENDING');

  // Moderation history state
  const [actions, setActions] = useState<ModerationActionItem[]>([]);
  const [actionsTotal, setActionsTotal] = useState(0);
  const [actionsPage, setActionsPage] = useState(1);
  const [actionsTotalPages, setActionsTotalPages] = useState(1);
  const [actionsLoading, setActionsLoading] = useState(true);

  const PAGE_SIZE = 5;

  // Load flagged content
  const loadFlaggedContent = useCallback(async () => {
    setFlaggedLoading(true);
    try {
      const result = await repository.listFlaggedContent({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page: flaggedPage,
        pageSize: PAGE_SIZE,
      });

      setFlaggedContent(
        result.items.map((item) => ({
          id: item.id,
          contentId: item.contentId,
          contentType: item.contentType,
          contentTitle: item.contentTitle,
          contentDescription: item.contentDescription,
          contentImageUrl: item.contentImageUrl,
          creatorId: item.creatorId,
          creatorName: item.creatorName,
          creatorEmail: item.creatorEmail,
          flaggedBy: item.flaggedBy,
          flagReason: item.flagReason,
          flagDetails: item.flagDetails,
          status: item.status,
          moderatorId: item.moderatorId,
          moderatorNote: item.moderatorNote,
          flaggedAt: item.flaggedAt,
          moderatedAt: item.moderatedAt,
        }))
      );
      setFlaggedTotal(result.total);
      setFlaggedTotalPages(result.totalPages);
    } finally {
      setFlaggedLoading(false);
    }
  }, [repository, statusFilter, flaggedPage]);

  // Load moderation history
  const loadModerationHistory = useCallback(async () => {
    setActionsLoading(true);
    try {
      const result = await repository.listModerationActions({
        page: actionsPage,
        pageSize: PAGE_SIZE,
      });

      setActions(
        result.items.map((item) => ({
          id: item.id,
          flaggedContentId: item.flaggedContentId,
          contentTitle: item.contentTitle,
          contentType: item.contentType,
          action: item.action,
          moderatorId: item.moderatorId,
          moderatorName: item.moderatorName,
          moderatorEmail: item.moderatorEmail,
          note: item.note,
          createdAt: item.createdAt,
        }))
      );
      setActionsTotal(result.total);
      setActionsTotalPages(result.totalPages);
    } finally {
      setActionsLoading(false);
    }
  }, [repository, actionsPage]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadFlaggedContent();
  }, [loadFlaggedContent]);

  useEffect(() => {
    loadModerationHistory();
  }, [loadModerationHistory]);

  // Handle status filter change
  const handleStatusFilterChange = useCallback((status: ModerationStatusValue | 'ALL') => {
    setStatusFilter(status);
    setFlaggedPage(1);
  }, []);

  // Handle moderation action
  const handleModerate = useCallback(
    async (
      contentId: string,
      action: ModerationActionValue,
      note?: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        // In production, moderator info would come from session
        await repository.moderateContent({
          flaggedContentId: contentId,
          action,
          moderatorId: 'admin-current',
          moderatorName: 'Admin Courant',
          moderatorEmail: 'admin@kpsull.com',
          note,
        });

        // Reload both lists
        await Promise.all([loadFlaggedContent(), loadModerationHistory()]);

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Une erreur s'est produite",
        };
      }
    },
    [repository, loadFlaggedContent, loadModerationHistory]
  );

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Moderation du contenu</h1>
        <p className="text-muted-foreground mt-1">
          Gerez les contenus signales par les utilisateurs
        </p>
      </div>

      {/* Flagged Content List */}
      <FlaggedContentList
        items={flaggedContent}
        total={flaggedTotal}
        page={flaggedPage}
        pageSize={PAGE_SIZE}
        totalPages={flaggedTotalPages}
        isLoading={flaggedLoading}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        onPageChange={setFlaggedPage}
        onModerate={handleModerate}
      />

      {/* Moderation History */}
      <ModerationHistory
        actions={actions}
        total={actionsTotal}
        page={actionsPage}
        pageSize={PAGE_SIZE}
        totalPages={actionsTotalPages}
        isLoading={actionsLoading}
        onPageChange={setActionsPage}
      />
    </div>
  );
}
