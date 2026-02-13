import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateNotificationPreferenceUseCase } from '../update-notification-preference.use-case';
import type { INotificationPreferenceRepository } from '../../ports/notification-preference.repository.interface';

function createMockRepository(): INotificationPreferenceRepository {
  return {
    findByUserId: vi.fn().mockResolvedValue([]),
    findByUserIdAndType: vi.fn().mockResolvedValue(null),
    upsert: vi.fn().mockResolvedValue({ id: '1', userId: 'user-1', type: 'REVIEW_RECEIVED', email: false, inApp: true }),
  };
}

describe('UpdateNotificationPreferenceUseCase', () => {
  let useCase: UpdateNotificationPreferenceUseCase;
  let mockRepo: INotificationPreferenceRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
    useCase = new UpdateNotificationPreferenceUseCase(mockRepo);
  });

  it('should update optional notification preference', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      type: 'REVIEW_RECEIVED',
      email: false,
      inApp: true,
    });

    expect(result.isSuccess).toBe(true);
    expect(mockRepo.upsert).toHaveBeenCalledWith('user-1', 'REVIEW_RECEIVED', false, true);
  });

  it('should reject update for mandatory notification type', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      type: 'ORDER_RECEIVED',
      email: false,
      inApp: true,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('obligatoires');
    expect(mockRepo.upsert).not.toHaveBeenCalled();
  });

  it('should reject invalid notification type', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      type: 'INVALID_TYPE' as never,
      email: true,
      inApp: true,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('invalide');
  });

  it('should allow disabling subscription expiring notification', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      type: 'SUBSCRIPTION_EXPIRING',
      email: false,
      inApp: false,
    });

    expect(result.isSuccess).toBe(true);
    expect(mockRepo.upsert).toHaveBeenCalledWith('user-1', 'SUBSCRIPTION_EXPIRING', false, false);
  });
});
