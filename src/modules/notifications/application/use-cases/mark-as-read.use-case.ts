import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application';
import type { NotificationRepository } from '../ports/notification.repository.interface';

export interface MarkAsReadInput {
  userId: string;
  notificationId?: string;
  markAll?: boolean;
}

export class MarkAsReadUseCase implements UseCase<MarkAsReadInput, void> {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute(input: MarkAsReadInput): Promise<Result<void>> {
    if (!input.userId?.trim()) {
      return Result.fail('User ID est requis');
    }

    // Mark all notifications as read
    if (input.markAll) {
      await this.notificationRepository.markAllAsRead(input.userId);
      return Result.ok();
    }

    // Mark single notification as read
    if (!input.notificationId?.trim()) {
      return Result.fail('Notification ID est requis');
    }

    const notification = await this.notificationRepository.findById(input.notificationId);

    if (!notification) {
      return Result.fail('Notification non trouvee');
    }

    // Verify ownership
    if (notification.recipientId !== input.userId) {
      return Result.fail('Non autorise a modifier cette notification');
    }

    await this.notificationRepository.markAsRead(input.notificationId);

    return Result.ok();
  }
}
