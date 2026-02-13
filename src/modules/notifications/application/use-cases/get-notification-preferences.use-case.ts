import { Result } from '@/shared/domain';
import type { NotificationTypeValue } from '../../domain/value-objects/notification-type.vo';
import { NotificationType } from '../../domain/value-objects/notification-type.vo';
import type {
  INotificationPreferenceRepository,
  NotificationPreferenceDto,
} from '../ports/notification-preference.repository.interface';

/** Types de notification configurables par les créateurs */
const CREATOR_CONFIGURABLE_TYPES: NotificationTypeValue[] = [
  'ORDER_RECEIVED',
  'ORDER_PAID',
  'RETURN_REQUEST_RECEIVED',
  'DISPUTE_OPENED',
  'REVIEW_RECEIVED',
  'SUBSCRIPTION_RENEWED',
  'SUBSCRIPTION_EXPIRING',
  'PAYMENT_FAILED',
  'ACCOUNT_SUSPENDED',
  'ACCOUNT_REACTIVATED',
];

export interface NotificationPreferenceItem {
  type: NotificationTypeValue;
  label: string;
  description: string;
  category: string;
  email: boolean;
  inApp: boolean;
  isMandatory: boolean;
}

const TYPE_LABELS: Record<string, { label: string; description: string; category: string }> = {
  ORDER_RECEIVED: { label: 'Nouvelle commande', description: 'Quand un client passe une commande', category: 'Commandes' },
  ORDER_PAID: { label: 'Paiement recu', description: 'Quand un paiement est confirme', category: 'Commandes' },
  RETURN_REQUEST_RECEIVED: { label: 'Demande de retour', description: 'Quand un client demande un retour', category: 'Commandes' },
  DISPUTE_OPENED: { label: 'Litige ouvert', description: 'Quand un client ouvre un litige', category: 'Commandes' },
  REVIEW_RECEIVED: { label: 'Avis recu', description: 'Quand un client laisse un avis sur un produit', category: 'Avis' },
  SUBSCRIPTION_RENEWED: { label: 'Abonnement renouvele', description: 'Quand votre abonnement est renouvele', category: 'Abonnement' },
  SUBSCRIPTION_EXPIRING: { label: 'Abonnement expire bientot', description: '7 jours avant l\'expiration de votre abonnement', category: 'Abonnement' },
  PAYMENT_FAILED: { label: 'Paiement echoue', description: 'Quand un paiement d\'abonnement echoue', category: 'Abonnement' },
  ACCOUNT_SUSPENDED: { label: 'Compte suspendu', description: 'Quand votre compte est suspendu', category: 'Compte' },
  ACCOUNT_REACTIVATED: { label: 'Compte reactive', description: 'Quand votre compte est reactive', category: 'Compte' },
};

export class GetNotificationPreferencesUseCase {
  constructor(private readonly preferenceRepository: INotificationPreferenceRepository) {}

  async execute(userId: string): Promise<Result<NotificationPreferenceItem[]>> {
    const savedPreferences = await this.preferenceRepository.findByUserId(userId);
    const savedMap = new Map<string, NotificationPreferenceDto>();
    for (const pref of savedPreferences) {
      savedMap.set(pref.type, pref);
    }

    const items: NotificationPreferenceItem[] = CREATOR_CONFIGURABLE_TYPES.map((type) => {
      const notifType = NotificationType.fromString(type);
      const isMandatory = notifType.isSuccess && notifType.value.isMandatory;
      const saved = savedMap.get(type);
      const meta = TYPE_LABELS[type] ?? { label: type, description: '', category: 'Autre' };

      return {
        type,
        label: meta.label,
        description: meta.description,
        category: meta.category,
        email: isMandatory ? true : (saved?.email ?? true),
        inApp: isMandatory ? true : (saved?.inApp ?? true),
        isMandatory,
      };
    });

    return Result.ok(items);
  }
}
