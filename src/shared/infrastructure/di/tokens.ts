/**
 * DI Tokens - Symbols used to identify registrations in the container.
 * Single source of truth for all dependency tokens.
 */

export const TOKENS = {
  // Infrastructure
  PrismaClient: Symbol('PrismaClient'),

  // Repositories
  AdminAnalyticsRepository: Symbol('AdminAnalyticsRepository'),
  CreatorRepository: Symbol('CreatorRepository'),
  CustomerRepository: Symbol('CustomerRepository'),
  ModerationRepository: Symbol('ModerationRepository'),
  UserRepository: Symbol('UserRepository'),
  ReturnRepository: Symbol('ReturnRepository'),

  // Use Cases - Admin Analytics
  GetAdminStatsUseCase: Symbol('GetAdminStatsUseCase'),
  ListCreatorsUseCase: Symbol('ListCreatorsUseCase'),
  SuspendCreatorUseCase: Symbol('SuspendCreatorUseCase'),
  ReactivateCreatorUseCase: Symbol('ReactivateCreatorUseCase'),

  // Use Cases - Creator Analytics
  GetDashboardStatsUseCase: Symbol('GetDashboardStatsUseCase'),
  GetSalesAnalyticsUseCase: Symbol('GetSalesAnalyticsUseCase'),
  ListCustomersUseCase: Symbol('ListCustomersUseCase'),

  // Use Cases - Moderation
  ListFlaggedContentUseCase: Symbol('ListFlaggedContentUseCase'),
  ModerateContentUseCase: Symbol('ModerateContentUseCase'),
  ListModerationActionsUseCase: Symbol('ListModerationActionsUseCase'),

  // Use Cases - Auth
  RegisterUserUseCase: Symbol('RegisterUserUseCase'),

  // Services
  PasswordHasher: Symbol('PasswordHasher'),
  DomainEventDispatcher: Symbol('DomainEventDispatcher'),
  UnitOfWork: Symbol('UnitOfWork'),
  PaymentProcessor: Symbol('PaymentProcessor'),
} as const;
