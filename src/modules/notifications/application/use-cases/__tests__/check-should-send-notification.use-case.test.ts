import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckShouldSendNotificationUseCase } from '../check-should-send-notification.use-case';
import type { INotificationPreferenceRepository } from '../../ports/notification-preference.repository.interface';

function createMockRepository(overrides: Partial<INotificationPreferenceRepository> = {}): INotificationPreferenceRepository {
  return {
    findByUserId: vi.fn().mockResolvedValue([]),
    findByUserIdAndType: vi.fn().mockResolvedValue(null),
    upsert: vi.fn().mockResolvedValue({ id: '1', userId: 'user-1', type: 'REVIEW_RECEIVED', email: true, inApp: true }),
    ...overrides,
  };
}

describe('CheckShouldSendNotificationUseCase', () => {
  let useCase: CheckShouldSendNotificationUseCase;
  let mockRepo: INotificationPreferenceRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
    useCase = new CheckShouldSendNotificationUseCase(mockRepo);
  });

  it('should always send mandatory notifications', async () => {
    mockRepo = createMockRepository({
      findByUserIdAndType: vi.fn().mockResolvedValue({
        id: '1', userId: 'user-1', type: 'ORDER_RECEIVED', email: false, inApp: false,
      }),
    });
    useCase = new CheckShouldSendNotificationUseCase(mockRepo);

    const result = await useCase.execute('user-1', 'ORDER_RECEIVED');

    expect(result.shouldSendEmail).toBe(true);
    expect(result.shouldSendInApp).toBe(true);
  });

  it('should send by default when no preference is saved', async () => {
    const result = await useCase.execute('user-1', 'REVIEW_RECEIVED');

    expect(result.shouldSendEmail).toBe(true);
    expect(result.shouldSendInApp).toBe(true);
  });

  it('should respect user preference to disable email', async () => {
    mockRepo = createMockRepository({
      findByUserIdAndType: vi.fn().mockResolvedValue({
        id: '1', userId: 'user-1', type: 'REVIEW_RECEIVED', email: false, inApp: true,
      }),
    });
    useCase = new CheckShouldSendNotificationUseCase(mockRepo);

    const result = await useCase.execute('user-1', 'REVIEW_RECEIVED');

    expect(result.shouldSendEmail).toBe(false);
    expect(result.shouldSendInApp).toBe(true);
  });

  it('should respect user preference to disable in-app', async () => {
    mockRepo = createMockRepository({
      findByUserIdAndType: vi.fn().mockResolvedValue({
        id: '1', userId: 'user-1', type: 'SUBSCRIPTION_EXPIRING', email: true, inApp: false,
      }),
    });
    useCase = new CheckShouldSendNotificationUseCase(mockRepo);

    const result = await useCase.execute('user-1', 'SUBSCRIPTION_EXPIRING');

    expect(result.shouldSendEmail).toBe(true);
    expect(result.shouldSendInApp).toBe(false);
  });

  it('should respect user preference to disable both', async () => {
    mockRepo = createMockRepository({
      findByUserIdAndType: vi.fn().mockResolvedValue({
        id: '1', userId: 'user-1', type: 'REVIEW_RECEIVED', email: false, inApp: false,
      }),
    });
    useCase = new CheckShouldSendNotificationUseCase(mockRepo);

    const result = await useCase.execute('user-1', 'REVIEW_RECEIVED');

    expect(result.shouldSendEmail).toBe(false);
    expect(result.shouldSendInApp).toBe(false);
  });
});
