/**
 * DI Registry - Configures the container with all implementations.
 * This is the SINGLE place where implementations are wired to interfaces.
 */

import { Container } from './container';
import { TOKENS } from './tokens';
import { InMemoryDomainEventDispatcher } from '../events/domain-event-dispatcher';
import { prisma } from '@/lib/prisma/client';

// Analytics repositories (Prisma implementations)
import { PrismaAdminAnalyticsRepository } from '@/modules/analytics/infrastructure/repositories/prisma-admin-analytics.repository';
import { PrismaCreatorRepository } from '@/modules/analytics/infrastructure/repositories/prisma-creator.repository';
import { PrismaCustomerRepository } from '@/modules/analytics/infrastructure/repositories/prisma-customer.repository';

// Moderation repository (Prisma implementation)
import { PrismaModerationRepository } from '@/modules/moderation/infrastructure/repositories/prisma-moderation.repository';

// Email service
import { ResendEmailService } from '@/modules/notifications/infrastructure/services/resend-email.service';
import { ConsoleEmailService } from '@/modules/notifications/infrastructure/services/console-email.service';

// Notification preferences repository
import { PrismaNotificationPreferenceRepository } from '@/modules/notifications/infrastructure/repositories/prisma-notification-preference.repository';

// Use Cases - Analytics
import { GetAdminStatsUseCase } from '@/modules/analytics/application/use-cases/get-admin-stats.use-case';
import { ListCreatorsUseCase } from '@/modules/analytics/application/use-cases/list-creators.use-case';
import { GetDashboardStatsUseCase } from '@/modules/analytics/application/use-cases/get-dashboard-stats.use-case';
import { GetSalesAnalyticsUseCase } from '@/modules/analytics/application/use-cases/get-sales-analytics.use-case';
import { ListCustomersUseCase } from '@/modules/analytics/application/use-cases/list-customers.use-case';

const container = new Container();

export function configureContainer(): Container {
  container.reset();

  // Infrastructure
  container.registerInstance(TOKENS.PrismaClient, prisma);

  // Domain Event Dispatcher
  container.register(TOKENS.DomainEventDispatcher, () => new InMemoryDomainEventDispatcher());

  // Repositories (Prisma implementations)
  container.register(TOKENS.AdminAnalyticsRepository, () => new PrismaAdminAnalyticsRepository(prisma));
  container.register(TOKENS.CreatorRepository, () => new PrismaCreatorRepository(prisma));
  container.register(TOKENS.CustomerRepository, () => new PrismaCustomerRepository(prisma));
  container.register(TOKENS.ModerationRepository, () => new PrismaModerationRepository(prisma));

  // Use Cases - Admin Analytics
  container.register(
    TOKENS.GetAdminStatsUseCase,
    () => new GetAdminStatsUseCase(container.get(TOKENS.AdminAnalyticsRepository))
  );
  container.register(
    TOKENS.ListCreatorsUseCase,
    () => new ListCreatorsUseCase(container.get(TOKENS.CreatorRepository))
  );

  // Use Cases - Creator Analytics
  container.register(
    TOKENS.GetDashboardStatsUseCase,
    () => new GetDashboardStatsUseCase(container.get(TOKENS.AdminAnalyticsRepository))
  );
  container.register(
    TOKENS.GetSalesAnalyticsUseCase,
    () => new GetSalesAnalyticsUseCase(container.get(TOKENS.AdminAnalyticsRepository))
  );
  container.register(
    TOKENS.ListCustomersUseCase,
    () => new ListCustomersUseCase(container.get(TOKENS.CustomerRepository))
  );

  // Email Service
  container.register(TOKENS.EmailService, () => {
    if (process.env.NODE_ENV === 'production' && process.env.RESEND_API_KEY) {
      return new ResendEmailService();
    }
    return new ConsoleEmailService();
  });

  // Notification Preferences Repository
  container.register(
    TOKENS.NotificationPreferenceRepository,
    () => new PrismaNotificationPreferenceRepository(prisma)
  );

  return container;
}

export function getContainer(): Container {
  return container;
}
