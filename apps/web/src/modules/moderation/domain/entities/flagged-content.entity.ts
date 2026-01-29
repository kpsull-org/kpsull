/**
 * Flagged Content Entity
 *
 * Story 11-5: Controle contenu
 *
 * Represents a piece of content that has been flagged for moderation.
 */

import type { FlagReasonValue } from '../value-objects/flag-reason.vo';
import type { ModerationStatusValue } from '../value-objects/moderation-status.vo';

export interface FlaggedContentProps {
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

export class FlaggedContent {
  private readonly props: FlaggedContentProps;

  constructor(props: FlaggedContentProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get contentId(): string {
    return this.props.contentId;
  }

  get contentType(): 'PRODUCT' | 'REVIEW' | 'PAGE' {
    return this.props.contentType;
  }

  get contentTitle(): string {
    return this.props.contentTitle;
  }

  get contentDescription(): string | undefined {
    return this.props.contentDescription;
  }

  get contentImageUrl(): string | undefined {
    return this.props.contentImageUrl;
  }

  get creatorId(): string {
    return this.props.creatorId;
  }

  get creatorName(): string {
    return this.props.creatorName;
  }

  get creatorEmail(): string {
    return this.props.creatorEmail;
  }

  get flaggedBy(): string {
    return this.props.flaggedBy;
  }

  get flagReason(): FlagReasonValue {
    return this.props.flagReason;
  }

  get flagDetails(): string | undefined {
    return this.props.flagDetails;
  }

  get status(): ModerationStatusValue {
    return this.props.status;
  }

  get moderatorId(): string | undefined {
    return this.props.moderatorId;
  }

  get moderatorNote(): string | undefined {
    return this.props.moderatorNote;
  }

  get flaggedAt(): Date {
    return this.props.flaggedAt;
  }

  get moderatedAt(): Date | undefined {
    return this.props.moderatedAt;
  }

  isPending(): boolean {
    return this.props.status === 'PENDING';
  }

  toJSON(): FlaggedContentProps {
    return { ...this.props };
  }
}
