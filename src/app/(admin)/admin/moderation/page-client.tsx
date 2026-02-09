'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  FlaggedContentList,
  ModerationHistory,
  type FlaggedContentItem,
  type ModerationActionItem,
} from '@/components/admin/flagged-content-list';
import type { ModerationStatusValue } from '@/modules/moderation/domain/value-objects/moderation-status.vo';
import type { ModerationActionValue } from '@/modules/moderation/domain/value-objects/moderation-action.vo';
import {
  listFlaggedContentAction,
  moderateContentAction,
  listModerationActionsAction,
} from './actions';

const PAGE_SIZE = 5;

/**
 * ModerationPageClient
 *
 * Story 11-5: Controle contenu
 *
 * Client component that uses server actions for data fetching and mutations.
 */
export function ModerationPageClient() {
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

  // Load flagged content via server action
  const loadFlaggedContent = useCallback(async () => {
    setFlaggedLoading(true);
    try {
      const result = await listFlaggedContentAction({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page: flaggedPage,
        pageSize: PAGE_SIZE,
      });

      if (result.success && result.data) {
        setFlaggedContent(
          result.data.items.map((item) => ({
            ...item,
            flaggedAt: new Date(item.flaggedAt),
            moderatedAt: item.moderatedAt ? new Date(item.moderatedAt) : undefined,
          }))
        );
        setFlaggedTotal(result.data.total);
        setFlaggedTotalPages(result.data.totalPages);
      }
    } finally {
      setFlaggedLoading(false);
    }
  }, [statusFilter, flaggedPage]);

  // Load moderation history via server action
  const loadModerationHistory = useCallback(async () => {
    setActionsLoading(true);
    try {
      const result = await listModerationActionsAction({
        page: actionsPage,
        pageSize: PAGE_SIZE,
      });

      if (result.success && result.data) {
        setActions(
          result.data.items.map((item) => ({
            ...item,
            createdAt: new Date(item.createdAt),
          }))
        );
        setActionsTotal(result.data.total);
        setActionsTotalPages(result.data.totalPages);
      }
    } finally {
      setActionsLoading(false);
    }
  }, [actionsPage]);

  useEffect(() => {
    loadFlaggedContent();
  }, [loadFlaggedContent]);

  useEffect(() => {
    loadModerationHistory();
  }, [loadModerationHistory]);

  const handleStatusFilterChange = useCallback((status: ModerationStatusValue | 'ALL') => {
    setStatusFilter(status);
    setFlaggedPage(1);
  }, []);

  const handleModerate = useCallback(
    async (
      contentId: string,
      action: ModerationActionValue,
      note?: string
    ): Promise<{ success: boolean; error?: string }> => {
      const result = await moderateContentAction({
        flaggedContentId: contentId,
        action,
        note,
      });

      if (result.success) {
        await Promise.all([loadFlaggedContent(), loadModerationHistory()]);
      }

      return result;
    },
    [loadFlaggedContent, loadModerationHistory]
  );

  return (
    <>
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

      <ModerationHistory
        actions={actions}
        total={actionsTotal}
        page={actionsPage}
        pageSize={PAGE_SIZE}
        totalPages={actionsTotalPages}
        isLoading={actionsLoading}
        onPageChange={setActionsPage}
      />
    </>
  );
}
