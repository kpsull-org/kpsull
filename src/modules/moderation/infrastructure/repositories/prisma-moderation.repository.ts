import type { PrismaClient } from '@prisma/client';
import type {
  IModerationRepository,
  ListFlaggedContentParams,
  ListFlaggedContentResult,
  ListModerationActionsParams,
  ListModerationActionsResult,
  ModerateContentParams,
} from '../../application/ports/moderation.repository.interface';
import { FlaggedContent } from '../../domain/entities/flagged-content.entity';
import { ModerationAction } from '../../domain/entities/moderation-action.entity';
import type { ModerationActionValue } from '../../domain/value-objects/moderation-action.vo';
import type { ModerationStatusValue } from '../../domain/value-objects/moderation-status.vo';

interface PrismaFlaggedContentWithCreator {
  id: string;
  contentId: string;
  contentType: string;
  contentTitle: string;
  contentDescription: string | null;
  contentImageUrl: string | null;
  creatorId: string;
  creator: { name: string | null; email: string };
  flaggedBy: string;
  flagReason: string;
  flagDetails: string | null;
  status: string;
  moderatorId: string | null;
  moderatorNote: string | null;
  flaggedAt: Date;
  moderatedAt: Date | null;
}

interface PrismaModerationActionWithRelations {
  id: string;
  flaggedContentId: string;
  flaggedContent: { contentTitle: string; contentType: string };
  action: string;
  moderatorId: string;
  moderator: { name: string | null; email: string };
  note: string | null;
  createdAt: Date;
}

const ACTION_TO_STATUS: Record<ModerationActionValue, ModerationStatusValue> = {
  APPROVE: 'APPROVED',
  HIDE: 'HIDDEN',
  DELETE: 'DELETED',
};

export class PrismaModerationRepository implements IModerationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listFlaggedContent(params: ListFlaggedContentParams): Promise<ListFlaggedContentResult> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (params.status) {
      where.status = params.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.flaggedContent.findMany({
        where,
        include: {
          creator: { select: { name: true, email: true } },
        },
        orderBy: { flaggedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.flaggedContent.count({ where }),
    ]);

    return {
      items: items.map((item: PrismaFlaggedContentWithCreator) => this.mapToFlaggedContent(item)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getFlaggedContentById(id: string): Promise<FlaggedContent | null> {
    const item = await this.prisma.flaggedContent.findUnique({
      where: { id },
      include: {
        creator: { select: { name: true, email: true } },
      },
    });

    if (!item) return null;
    return this.mapToFlaggedContent(item);
  }

  async moderateContent(params: ModerateContentParams): Promise<FlaggedContent> {
    const newStatus = ACTION_TO_STATUS[params.action];

    const [updated] = await this.prisma.$transaction([
      this.prisma.flaggedContent.update({
        where: { id: params.flaggedContentId },
        data: {
          status: newStatus,
          moderatorId: params.moderatorId,
          moderatorNote: params.note,
          moderatedAt: new Date(),
        },
        include: {
          creator: { select: { name: true, email: true } },
        },
      }),
      this.prisma.moderationActionRecord.create({
        data: {
          flaggedContentId: params.flaggedContentId,
          action: params.action,
          moderatorId: params.moderatorId,
          note: params.note,
        },
      }),
    ]);

    return this.mapToFlaggedContent(updated);
  }

  async listModerationActions(params: ListModerationActionsParams): Promise<ListModerationActionsResult> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.moderationActionRecord.findMany({
        include: {
          flaggedContent: { select: { contentTitle: true, contentType: true } },
          moderator: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.moderationActionRecord.count(),
    ]);

    return {
      items: items.map((item: PrismaModerationActionWithRelations) =>
        new ModerationAction({
          id: item.id,
          flaggedContentId: item.flaggedContentId,
          contentTitle: item.flaggedContent.contentTitle,
          contentType: item.flaggedContent.contentType as 'PRODUCT' | 'REVIEW' | 'PAGE',
          action: item.action as ModerationActionValue,
          moderatorId: item.moderatorId,
          moderatorName: item.moderator.name ?? 'Unknown',
          moderatorEmail: item.moderator.email,
          note: item.note ?? undefined,
          createdAt: item.createdAt,
        })
      ),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  private mapToFlaggedContent(item: PrismaFlaggedContentWithCreator): FlaggedContent {
    return new FlaggedContent({
      id: item.id,
      contentId: item.contentId,
      contentType: item.contentType as 'PRODUCT' | 'REVIEW' | 'PAGE',
      contentTitle: item.contentTitle,
      contentDescription: item.contentDescription ?? undefined,
      contentImageUrl: item.contentImageUrl ?? undefined,
      creatorId: item.creatorId,
      creatorName: item.creator.name ?? 'Unknown',
      creatorEmail: item.creator.email,
      flaggedBy: item.flaggedBy,
      flagReason: item.flagReason as 'INAPPROPRIATE_CONTENT' | 'COUNTERFEIT' | 'PROHIBITED_ITEM' | 'MISLEADING_DESCRIPTION' | 'SPAM' | 'OTHER',
      flagDetails: item.flagDetails ?? undefined,
      status: item.status as ModerationStatusValue,
      moderatorId: item.moderatorId ?? undefined,
      moderatorNote: item.moderatorNote ?? undefined,
      flaggedAt: item.flaggedAt,
      moderatedAt: item.moderatedAt ?? undefined,
    });
  }
}
