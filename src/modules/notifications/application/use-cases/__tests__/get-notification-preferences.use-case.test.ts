import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetNotificationPreferencesUseCase } from '../get-notification-preferences.use-case';
import type { INotificationPreferenceRepository } from '../../ports/notification-preference.repository.interface';

function createMockRepository(overrides: Partial<INotificationPreferenceRepository> = {}): INotificationPreferenceRepository {
  return {
    findByUserId: vi.fn().mockResolvedValue([]),
    findByUserIdAndType: vi.fn().mockResolvedValue(null),
    upsert: vi.fn().mockResolvedValue({ id: '1', userId: 'user-1', type: 'REVIEW_RECEIVED', email: true, inApp: true }),
    ...overrides,
  };
}

describe('GetNotificationPreferencesUseCase', () => {
  let useCase: GetNotificationPreferencesUseCase;
  let mockRepo: INotificationPreferenceRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
    useCase = new GetNotificationPreferencesUseCase(mockRepo);
  });

  it('should return all configurable notification types with defaults', async () => {
    const result = await useCase.execute('user-1');

    expect(result.isSuccess).toBe(true);
    const items = result.value;
    expect(items.length).toBeGreaterThan(0);

    // All items should have email and inApp true by default
    for (const item of items) {
      expect(item.email).toBe(true);
      expect(item.inApp).toBe(true);
    }
  });

  it('should mark mandatory types correctly', async () => {
    const result = await useCase.execute('user-1');
    const items = result.value;

    const mandatoryItem = items.find((i) => i.type === 'ORDER_RECEIVED');
    expect(mandatoryItem?.isMandatory).toBe(true);

    const optionalItem = items.find((i) => i.type === 'REVIEW_RECEIVED');
    expect(optionalItem?.isMandatory).toBe(false);
  });

  it('should use saved preferences when available', async () => {
    mockRepo = createMockRepository({
      findByUserId: vi.fn().mockResolvedValue([
        { id: '1', userId: 'user-1', type: 'REVIEW_RECEIVED', email: false, inApp: true },
      ]),
    });
    useCase = new GetNotificationPreferencesUseCase(mockRepo);

    const result = await useCase.execute('user-1');
    const reviewPref = result.value.find((i) => i.type === 'REVIEW_RECEIVED');

    expect(reviewPref?.email).toBe(false);
    expect(reviewPref?.inApp).toBe(true);
  });

  it('should force mandatory types to true even if saved as false', async () => {
    mockRepo = createMockRepository({
      findByUserId: vi.fn().mockResolvedValue([
        { id: '1', userId: 'user-1', type: 'ORDER_RECEIVED', email: false, inApp: false },
      ]),
    });
    useCase = new GetNotificationPreferencesUseCase(mockRepo);

    const result = await useCase.execute('user-1');
    const orderPref = result.value.find((i) => i.type === 'ORDER_RECEIVED');

    expect(orderPref?.email).toBe(true);
    expect(orderPref?.inApp).toBe(true);
    expect(orderPref?.isMandatory).toBe(true);
  });

  it('should group preferences by category', async () => {
    const result = await useCase.execute('user-1');
    const categories = new Set(result.value.map((i) => i.category));

    expect(categories.has('Commandes')).toBe(true);
    expect(categories.has('Abonnement')).toBe(true);
  });
});
