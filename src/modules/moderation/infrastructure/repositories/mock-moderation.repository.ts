/**
 * Mock Moderation Repository
 *
 * Story 11-5: Controle contenu
 *
 * Provides mock data for flagged content and moderation actions.
 */

import type {
  IModerationRepository,
  ListFlaggedContentParams,
  ListFlaggedContentResult,
  ListModerationActionsParams,
  ListModerationActionsResult,
  ModerateContentParams,
} from '../../application/ports/moderation.repository.interface';
import { FlaggedContent, type FlaggedContentProps } from '../../domain/entities/flagged-content.entity';
import { ModerationAction, type ModerationActionProps } from '../../domain/entities/moderation-action.entity';
import type { ModerationStatusValue } from '../../domain/value-objects/moderation-status.vo';
import type { ModerationActionValue } from '../../domain/value-objects/moderation-action.vo';

// Mock flagged content data
const mockFlaggedContentData: FlaggedContentProps[] = [
  {
    id: 'flag-001',
    contentId: 'prod-101',
    contentType: 'PRODUCT',
    contentTitle: 'Sac a main de luxe',
    contentDescription: 'Sac de marque a prix reduit',
    contentImageUrl: '/images/products/bag-001.jpg',
    creatorId: 'creator-001',
    creatorName: 'Marie Boutique',
    creatorEmail: 'marie@boutique.com',
    flaggedBy: 'user-501',
    flagReason: 'COUNTERFEIT',
    flagDetails: 'Ce sac semble etre une contrefacon de marque de luxe',
    status: 'PENDING',
    flaggedAt: new Date('2025-01-28T14:30:00Z'),
  },
  {
    id: 'flag-002',
    contentId: 'prod-102',
    contentType: 'PRODUCT',
    contentTitle: 'Complement alimentaire miracle',
    contentDescription: 'Perdez 10kg en 1 semaine!',
    contentImageUrl: '/images/products/supplement-001.jpg',
    creatorId: 'creator-002',
    creatorName: 'Health Store',
    creatorEmail: 'contact@healthstore.com',
    flaggedBy: 'user-502',
    flagReason: 'MISLEADING_DESCRIPTION',
    flagDetails: 'Allegations de sante non prouvees et potentiellement dangereuses',
    status: 'PENDING',
    flaggedAt: new Date('2025-01-28T10:15:00Z'),
  },
  {
    id: 'flag-003',
    contentId: 'prod-103',
    contentType: 'PRODUCT',
    contentTitle: 'T-shirt personnalise',
    contentDescription: 'T-shirt avec design personnalise',
    contentImageUrl: '/images/products/tshirt-001.jpg',
    creatorId: 'creator-003',
    creatorName: 'Custom Wear',
    creatorEmail: 'info@customwear.com',
    flaggedBy: 'user-503',
    flagReason: 'INAPPROPRIATE_CONTENT',
    flagDetails: 'Image offensive sur le t-shirt',
    status: 'PENDING',
    flaggedAt: new Date('2025-01-27T16:45:00Z'),
  },
  {
    id: 'flag-004',
    contentId: 'review-201',
    contentType: 'REVIEW',
    contentTitle: 'Avis sur "Montre connectee"',
    contentDescription: 'ACHETEZ SUR CE SITE: www.spam-site.com',
    creatorId: 'creator-004',
    creatorName: 'Tech Reviews',
    creatorEmail: 'reviews@techsite.com',
    flaggedBy: 'user-504',
    flagReason: 'SPAM',
    flagDetails: 'Cet avis contient des liens de spam',
    status: 'PENDING',
    flaggedAt: new Date('2025-01-27T09:20:00Z'),
  },
  {
    id: 'flag-005',
    contentId: 'prod-104',
    contentType: 'PRODUCT',
    contentTitle: 'Couteau de collection',
    contentDescription: 'Couteau artisanal de collection',
    contentImageUrl: '/images/products/knife-001.jpg',
    creatorId: 'creator-005',
    creatorName: 'Artisan Blades',
    creatorEmail: 'contact@artisanblades.com',
    flaggedBy: 'user-505',
    flagReason: 'PROHIBITED_ITEM',
    flagDetails: 'Vente potentiellement illegale',
    status: 'PENDING',
    flaggedAt: new Date('2025-01-26T11:00:00Z'),
  },
  {
    id: 'flag-006',
    contentId: 'prod-105',
    contentType: 'PRODUCT',
    contentTitle: 'Bijoux faits main',
    contentDescription: 'Magnifiques bijoux artisanaux',
    contentImageUrl: '/images/products/jewelry-001.jpg',
    creatorId: 'creator-006',
    creatorName: 'Bijoux Artisanaux',
    creatorEmail: 'bijoux@artisan.com',
    flaggedBy: 'user-506',
    flagReason: 'OTHER',
    flagDetails: 'Signalement sans fondement - contenu legitime',
    status: 'APPROVED',
    moderatorId: 'admin-001',
    moderatorNote: 'Contenu verifie et approuve - signalement non justifie',
    flaggedAt: new Date('2025-01-25T14:00:00Z'),
    moderatedAt: new Date('2025-01-25T16:30:00Z'),
  },
  {
    id: 'flag-007',
    contentId: 'prod-106',
    contentType: 'PRODUCT',
    contentTitle: 'Produit pharmaceutique non autorise',
    contentDescription: 'Medicament sans ordonnance',
    creatorId: 'creator-007',
    creatorName: 'Pharma Direct',
    creatorEmail: 'sales@pharmadirect.com',
    flaggedBy: 'user-507',
    flagReason: 'PROHIBITED_ITEM',
    flagDetails: 'Vente de medicaments sans autorisation',
    status: 'DELETED',
    moderatorId: 'admin-001',
    moderatorNote: 'Contenu supprime - vente de medicaments non autorisee',
    flaggedAt: new Date('2025-01-24T08:00:00Z'),
    moderatedAt: new Date('2025-01-24T09:15:00Z'),
  },
  {
    id: 'flag-008',
    contentId: 'page-301',
    contentType: 'PAGE',
    contentTitle: 'Page de presentation douteuse',
    contentDescription: 'Page avec contenu suspect',
    creatorId: 'creator-008',
    creatorName: 'Suspect Shop',
    creatorEmail: 'contact@suspectshop.com',
    flaggedBy: 'user-508',
    flagReason: 'INAPPROPRIATE_CONTENT',
    flagDetails: 'Page contenant du contenu adulte non filtre',
    status: 'HIDDEN',
    moderatorId: 'admin-002',
    moderatorNote: 'Page masquee en attendant revision complete',
    flaggedAt: new Date('2025-01-23T12:00:00Z'),
    moderatedAt: new Date('2025-01-23T14:00:00Z'),
  },
];

// Mock moderation actions history
const mockModerationActionsData: ModerationActionProps[] = [
  {
    id: 'action-001',
    flaggedContentId: 'flag-006',
    contentTitle: 'Bijoux faits main',
    contentType: 'PRODUCT',
    action: 'APPROVE',
    moderatorId: 'admin-001',
    moderatorName: 'Jean Admin',
    moderatorEmail: 'jean@kpsull.com',
    note: 'Contenu verifie et approuve - signalement non justifie',
    createdAt: new Date('2025-01-25T16:30:00Z'),
  },
  {
    id: 'action-002',
    flaggedContentId: 'flag-007',
    contentTitle: 'Produit pharmaceutique non autorise',
    contentType: 'PRODUCT',
    action: 'DELETE',
    moderatorId: 'admin-001',
    moderatorName: 'Jean Admin',
    moderatorEmail: 'jean@kpsull.com',
    note: 'Contenu supprime - vente de medicaments non autorisee',
    createdAt: new Date('2025-01-24T09:15:00Z'),
  },
  {
    id: 'action-003',
    flaggedContentId: 'flag-008',
    contentTitle: 'Page de presentation douteuse',
    contentType: 'PAGE',
    action: 'HIDE',
    moderatorId: 'admin-002',
    moderatorName: 'Sophie Moderator',
    moderatorEmail: 'sophie@kpsull.com',
    note: 'Page masquee en attendant revision complete',
    createdAt: new Date('2025-01-23T14:00:00Z'),
  },
];

export class MockModerationRepository implements IModerationRepository {
  private flaggedContent: FlaggedContentProps[] = [...mockFlaggedContentData];
  private moderationActions: ModerationActionProps[] = [...mockModerationActionsData];

  async listFlaggedContent(params: ListFlaggedContentParams): Promise<ListFlaggedContentResult> {
    const { status, page = 1, pageSize = 10 } = params;

    let filtered = this.flaggedContent;

    if (status) {
      filtered = filtered.filter((item) => item.status === status);
    }

    // Sort by flaggedAt descending (most recent first)
    filtered = filtered.sort(
      (a, b) => new Date(b.flaggedAt).getTime() - new Date(a.flaggedAt).getTime()
    );

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = filtered.slice(startIndex, endIndex);

    const items = paginatedItems.map(
      (props) =>
        new FlaggedContent({
          ...props,
          flaggedAt: new Date(props.flaggedAt),
          moderatedAt: props.moderatedAt ? new Date(props.moderatedAt) : undefined,
        })
    );

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async getFlaggedContentById(id: string): Promise<FlaggedContent | null> {
    const found = this.flaggedContent.find((item) => item.id === id);

    if (!found) {
      return null;
    }

    return new FlaggedContent({
      ...found,
      flaggedAt: new Date(found.flaggedAt),
      moderatedAt: found.moderatedAt ? new Date(found.moderatedAt) : undefined,
    });
  }

  async moderateContent(params: ModerateContentParams): Promise<FlaggedContent> {
    const { flaggedContentId, action, moderatorId, moderatorName, moderatorEmail, note } = params;

    const index = this.flaggedContent.findIndex((item) => item.id === flaggedContentId);

    if (index === -1) {
      throw new Error('Flagged content not found');
    }

    const existingContent = this.flaggedContent[index];
    if (!existingContent) {
      throw new Error('Flagged content not found');
    }

    // Map action to status
    const statusMap: Record<ModerationActionValue, ModerationStatusValue> = {
      APPROVE: 'APPROVED',
      HIDE: 'HIDDEN',
      DELETE: 'DELETED',
    };

    const newStatus = statusMap[action];
    const now = new Date();

    // Update flagged content
    const updatedContent: FlaggedContentProps = {
      ...existingContent,
      status: newStatus,
      moderatorId,
      moderatorNote: note,
      moderatedAt: now,
    };
    this.flaggedContent[index] = updatedContent;

    // Create moderation action
    const newAction: ModerationActionProps = {
      id: `action-${Date.now()}`,
      flaggedContentId,
      contentTitle: updatedContent.contentTitle,
      contentType: updatedContent.contentType,
      action,
      moderatorId,
      moderatorName,
      moderatorEmail,
      note,
      createdAt: now,
    };

    this.moderationActions.unshift(newAction);

    return new FlaggedContent({
      ...updatedContent,
      flaggedAt: new Date(updatedContent.flaggedAt),
      moderatedAt: now,
    });
  }

  async listModerationActions(params: ListModerationActionsParams): Promise<ListModerationActionsResult> {
    const { page = 1, pageSize = 10 } = params;

    // Sort by createdAt descending (most recent first)
    const sorted = [...this.moderationActions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = sorted.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = sorted.slice(startIndex, endIndex);

    const items = paginatedItems.map(
      (props) =>
        new ModerationAction({
          ...props,
          createdAt: new Date(props.createdAt),
        })
    );

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  }
}
