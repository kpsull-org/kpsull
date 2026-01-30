import { Entity, UniqueId, Result } from '@/shared/domain';
import { NotificationType } from '../value-objects/notification-type.vo';

interface NotificationProps {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
}

interface CreateNotificationProps {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

interface ReconstituteNotificationProps {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
}

/**
 * Notification Entity
 *
 * Represents a notification sent to a user or creator.
 * Notifications can be marked as read and contain metadata
 * relevant to the notification type.
 */
export class Notification extends Entity<NotificationProps> {
  private static readonly MAX_TITLE_LENGTH = 255;
  private static readonly MAX_MESSAGE_LENGTH = 2000;

  private constructor(props: NotificationProps, id?: UniqueId) {
    super(props, id);
  }

  get idString(): string {
    return this._id.toString();
  }

  get recipientId(): string {
    return this.props.recipientId;
  }

  get type(): NotificationType {
    return this.props.type;
  }

  get title(): string {
    return this.props.title;
  }

  get message(): string {
    return this.props.message;
  }

  get metadata(): Record<string, unknown> {
    return this.props.metadata;
  }

  get readAt(): Date | null {
    return this.props.readAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get isRead(): boolean {
    return this.props.readAt !== null;
  }

  /**
   * Mark the notification as read
   * Does nothing if already read
   */
  markAsRead(): void {
    if (this.props.readAt === null) {
      this.props.readAt = new Date();
    }
  }

  private static validateTitle(title: string): Result<void> {
    if (!title?.trim()) {
      return Result.fail('Le titre est requis');
    }

    if (title.trim().length > Notification.MAX_TITLE_LENGTH) {
      return Result.fail(`Le titre ne peut pas depasser ${Notification.MAX_TITLE_LENGTH} caracteres`);
    }

    return Result.ok();
  }

  private static validateMessage(message: string): Result<void> {
    if (!message?.trim()) {
      return Result.fail('Le message est requis');
    }

    if (message.trim().length > Notification.MAX_MESSAGE_LENGTH) {
      return Result.fail(`Le message ne peut pas depasser ${Notification.MAX_MESSAGE_LENGTH} caracteres`);
    }

    return Result.ok();
  }

  static create(props: CreateNotificationProps): Result<Notification> {
    if (!props.recipientId?.trim()) {
      return Result.fail('Recipient ID est requis');
    }

    const titleValidation = Notification.validateTitle(props.title);
    if (titleValidation.isFailure) {
      return Result.fail(titleValidation.error!);
    }

    const messageValidation = Notification.validateMessage(props.message);
    if (messageValidation.isFailure) {
      return Result.fail(messageValidation.error!);
    }

    return Result.ok(
      new Notification({
        recipientId: props.recipientId,
        type: props.type,
        title: props.title.trim(),
        message: props.message.trim(),
        metadata: props.metadata ?? {},
        readAt: null,
        createdAt: new Date(),
      })
    );
  }

  static reconstitute(props: ReconstituteNotificationProps): Result<Notification> {
    const typeResult = NotificationType.fromString(props.type);
    if (typeResult.isFailure) {
      return Result.fail(typeResult.error!);
    }

    return Result.ok(
      new Notification(
        {
          recipientId: props.recipientId,
          type: typeResult.value,
          title: props.title,
          message: props.message,
          metadata: props.metadata,
          readAt: props.readAt,
          createdAt: props.createdAt,
        },
        UniqueId.fromString(props.id)
      )
    );
  }
}
