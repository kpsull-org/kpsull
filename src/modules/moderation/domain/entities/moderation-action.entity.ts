/**
 * Moderation Action Entity
 *
 * Story 11-5: Controle contenu - AC3: Historique des actions
 *
 * Represents an action taken by a moderator on flagged content.
 */

import type { ModerationActionValue } from '../value-objects/moderation-action.vo';

export interface ModerationActionProps {
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

export class ModerationAction {
  private readonly props: ModerationActionProps;

  constructor(props: ModerationActionProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get flaggedContentId(): string {
    return this.props.flaggedContentId;
  }

  get contentTitle(): string {
    return this.props.contentTitle;
  }

  get contentType(): 'PRODUCT' | 'REVIEW' | 'PAGE' {
    return this.props.contentType;
  }

  get action(): ModerationActionValue {
    return this.props.action;
  }

  get moderatorId(): string {
    return this.props.moderatorId;
  }

  get moderatorName(): string {
    return this.props.moderatorName;
  }

  get moderatorEmail(): string {
    return this.props.moderatorEmail;
  }

  get note(): string | undefined {
    return this.props.note;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): ModerationActionProps {
    return { ...this.props };
  }
}
