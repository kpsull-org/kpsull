import type { PrismaClient } from '@prisma/client';
import type { NotificationTypeValue } from '../../domain/value-objects/notification-type.vo';
import type {
  INotificationPreferenceRepository,
  NotificationPreferenceDto,
} from '../../application/ports/notification-preference.repository.interface';

export class PrismaNotificationPreferenceRepository implements INotificationPreferenceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserId(userId: string): Promise<NotificationPreferenceDto[]> {
    const records = await this.prisma.notificationPreference.findMany({
      where: { userId },
      orderBy: { type: 'asc' },
    });

    return records.map((r) => ({
      id: r.id,
      userId: r.userId,
      type: r.type as NotificationTypeValue,
      email: r.email,
      inApp: r.inApp,
    }));
  }

  async findByUserIdAndType(
    userId: string,
    type: NotificationTypeValue
  ): Promise<NotificationPreferenceDto | null> {
    const record = await this.prisma.notificationPreference.findUnique({
      where: { userId_type: { userId, type } },
    });

    if (!record) return null;

    return {
      id: record.id,
      userId: record.userId,
      type: record.type as NotificationTypeValue,
      email: record.email,
      inApp: record.inApp,
    };
  }

  async upsert(
    userId: string,
    type: NotificationTypeValue,
    email: boolean,
    inApp: boolean
  ): Promise<NotificationPreferenceDto> {
    const record = await this.prisma.notificationPreference.upsert({
      where: { userId_type: { userId, type } },
      create: { userId, type, email, inApp },
      update: { email, inApp },
    });

    return {
      id: record.id,
      userId: record.userId,
      type: record.type as NotificationTypeValue,
      email: record.email,
      inApp: record.inApp,
    };
  }
}
