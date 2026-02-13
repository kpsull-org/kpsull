import type { NotificationTypeValue } from '../../domain/value-objects/notification-type.vo';

export interface NotificationPreferenceDto {
  id: string;
  userId: string;
  type: NotificationTypeValue;
  email: boolean;
  inApp: boolean;
}

export interface INotificationPreferenceRepository {
  findByUserId(userId: string): Promise<NotificationPreferenceDto[]>;
  findByUserIdAndType(userId: string, type: NotificationTypeValue): Promise<NotificationPreferenceDto | null>;
  upsert(userId: string, type: NotificationTypeValue, email: boolean, inApp: boolean): Promise<NotificationPreferenceDto>;
}
