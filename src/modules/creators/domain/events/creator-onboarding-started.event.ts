import { DomainEvent } from '@/shared/domain/domain-event.base';

interface CreatorOnboardingStartedEventPayload {
  onboardingId: string;
  userId: string;
}

/**
 * Event emitted when a creator onboarding process is started
 */
export class CreatorOnboardingStartedEvent
  implements DomainEvent<CreatorOnboardingStartedEventPayload>
{
  readonly eventType = 'CreatorOnboardingStarted';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: CreatorOnboardingStartedEventPayload;

  constructor(payload: CreatorOnboardingStartedEventPayload) {
    this.aggregateId = payload.onboardingId;
    this.payload = payload;
    this.occurredAt = new Date();
  }
}
