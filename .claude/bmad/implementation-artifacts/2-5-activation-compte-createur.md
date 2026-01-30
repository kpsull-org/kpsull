# Story 2.5: Activation du Compte Créateur

Status: ready-for-dev

## Story

As a Client ayant complété l'onboarding,
I want que mon compte soit activé en tant que Créateur,
so that je puisse accéder au dashboard créateur et commencer à vendre.

## Acceptance Criteria

1. **AC1 - Conditions d'activation remplies**
   - **Given** un Client avec SIRET vérifié et Stripe Connect configuré
   - **When** l'activation est déclenchée
   - **Then** le système vérifie que toutes les conditions sont remplies

2. **AC2 - Création de l'enregistrement Creator**
   - **Given** les conditions remplies
   - **When** l'activation est traitée
   - **Then** un enregistrement Creator est créé avec les informations saisies
   - **And** brandName, siret, address sont remplis
   - **And** stripeAccountId est associé

3. **AC3 - Création de la Subscription FREE**
   - **Given** un Creator créé
   - **When** l'activation est finalisée
   - **Then** une Subscription FREE est créée
   - **And** productLimit = 5, salesLimit = 10
   - **And** status = ACTIVE

4. **AC4 - Changement de rôle User**
   - **Given** la Subscription créée
   - **When** l'activation est complète
   - **Then** le rôle User passe de CLIENT à CREATOR
   - **And** la session JWT est mise à jour avec le nouveau rôle

5. **AC5 - Redirection et email de bienvenue**
   - **Given** l'activation complète
   - **When** l'utilisateur est redirigé
   - **Then** il arrive sur le dashboard créateur
   - **And** un email de bienvenue créateur est envoyé via Resend

6. **AC6 - Notification Admin**
   - **Given** un nouveau créateur activé
   - **When** un Admin consulte le dashboard admin
   - **Then** une notification "Nouveau créateur : [nom]" est visible

## Tasks / Subtasks

- [ ] **Task 1: Créer la page de confirmation** (AC: #1)
  - [ ] 1.1 Créer `src/app/(auth)/onboarding/creator/complete/page.tsx`
  - [ ] 1.2 Afficher un récapitulatif des informations
  - [ ] 1.3 Bouton "Activer mon compte créateur"

- [ ] **Task 2: Implémenter le use case ActivateCreatorAccount** (AC: #1-4)
  - [ ] 2.1 Créer `src/modules/creators/application/use-cases/activate-creator-account.use-case.ts`
  - [ ] 2.2 Vérifier les prérequis (SIRET, Stripe)
  - [ ] 2.3 Créer l'enregistrement Creator
  - [ ] 2.4 Créer la Subscription FREE
  - [ ] 2.5 Mettre à jour le rôle User

- [ ] **Task 3: Implémenter l'email de bienvenue** (AC: #5)
  - [ ] 3.1 Créer le template email `src/lib/resend/templates/welcome-creator.tsx`
  - [ ] 3.2 Configurer l'envoi via Resend
  - [ ] 3.3 Inclure les informations utiles (premiers pas, liens)

- [ ] **Task 4: Implémenter la notification Admin** (AC: #6)
  - [ ] 4.1 Créer le modèle Notification dans Prisma si nécessaire
  - [ ] 4.2 Créer la notification lors de l'activation
  - [ ] 4.3 Afficher dans le dashboard admin

- [ ] **Task 5: Mettre à jour la session** (AC: #4)
  - [ ] 5.1 Forcer le refresh de la session après activation
  - [ ] 5.2 Inclure le nouveau rôle dans le JWT
  - [ ] 5.3 Rediriger vers le dashboard créateur

- [ ] **Task 6: Écrire les tests** (AC: #1-6)
  - [ ] 6.1 Tests unitaires pour le use case
  - [ ] 6.2 Tests d'intégration pour le flow complet
  - [ ] 6.3 Tests pour l'envoi d'email (mock Resend)

## Dev Notes

### Use Case ActivateCreatorAccount

```typescript
// src/modules/creators/application/use-cases/activate-creator-account.use-case.ts
export class ActivateCreatorAccountUseCase implements IUseCase<ActivateCreatorDTO, ActivateCreatorResultDTO> {
  constructor(
    private readonly creatorRepo: ICreatorRepository,
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly userRepo: IUserRepository,
    private readonly emailService: IEmailService,
    private readonly notificationService: INotificationService
  ) {}

  async execute(dto: ActivateCreatorDTO): Promise<Result<ActivateCreatorResultDTO>> {
    // 1. Vérifier les prérequis
    const onboarding = await this.creatorRepo.getOnboarding(dto.userId);

    if (!onboarding?.siretVerified) {
      return Result.fail("Le SIRET n'est pas vérifié");
    }

    if (!onboarding?.stripeOnboarded) {
      return Result.fail("Le compte Stripe n'est pas configuré");
    }

    // 2. Créer le Creator
    const creator = await this.creatorRepo.create({
      userId: dto.userId,
      brandName: onboarding.brandName,
      siret: onboarding.siret,
      address: onboarding.address,
      stripeAccountId: onboarding.stripeAccountId,
      siretVerified: true,
      siretVerifiedAt: onboarding.siretVerifiedAt,
      stripeOnboarded: true,
      stripeOnboardedAt: onboarding.stripeOnboardedAt,
    });

    // 3. Créer la Subscription FREE
    await this.subscriptionRepo.create({
      creatorId: creator.id,
      plan: "FREE",
      status: "ACTIVE",
      productLimit: 5,
      salesLimit: 10,
      currentProductCount: 0,
      currentSalesCount: 0,
      startDate: new Date(),
    });

    // 4. Mettre à jour le rôle
    await this.userRepo.updateRole(dto.userId, "CREATOR");

    // 5. Envoyer l'email de bienvenue
    const user = await this.userRepo.findById(dto.userId);
    await this.emailService.sendWelcomeCreator({
      email: user.email,
      name: user.name,
      brandName: creator.brandName,
    });

    // 6. Créer la notification Admin
    await this.notificationService.notifyAdmins({
      type: "NEW_CREATOR",
      title: `Nouveau créateur : ${creator.brandName}`,
      data: { creatorId: creator.id },
    });

    return Result.ok({
      creatorId: creator.id,
      message: "Compte créateur activé avec succès",
    });
  }
}
```

### Template Email Bienvenue

```typescript
// src/lib/resend/templates/welcome-creator.tsx
import { Html, Head, Body, Container, Section, Text, Button, Hr } from "@react-email/components";

interface WelcomeCreatorEmailProps {
  name: string;
  brandName: string;
}

export function WelcomeCreatorEmail({ name, brandName }: WelcomeCreatorEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Text style={heading}>Bienvenue sur Kpsull, {name} ! 🎉</Text>
            <Text style={paragraph}>
              Votre compte créateur "{brandName}" est maintenant actif.
              Vous pouvez commencer à vendre vos créations !
            </Text>
            <Hr />
            <Text style={paragraph}>Prochaines étapes :</Text>
            <ul>
              <li>Créez votre premier projet</li>
              <li>Ajoutez vos produits avec photos</li>
              <li>Personnalisez votre page créateur</li>
              <li>Publiez et partagez !</li>
            </ul>
            <Button href={`${process.env.NEXTAUTH_URL}/dashboard`} style={button}>
              Accéder à mon dashboard
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

### Schéma Prisma Creator

```prisma
model Creator {
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  brandName         String
  slug              String    @unique
  siret             String
  siretVerified     Boolean   @default(false)
  siretVerifiedAt   DateTime?

  stripeAccountId   String?   @unique
  stripeOnboarded   Boolean   @default(false)
  stripeOnboardedAt DateTime?

  // Address
  street            String
  postalCode        String
  city              String
  country           String    @default("FR")

  // Stats dénormalisés
  totalRevenue      Decimal   @default(0) @db.Decimal(10, 2)
  totalOrders       Int       @default(0)
  totalProducts     Int       @default(0)

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  subscription      Subscription?
  products          Product[]
  orders            Order[]
  page              CreatorPage?

  @@index([userId])
  @@map("creators")
}
```

### Références

- [Source: architecture.md#Domain Events]
- [Source: architecture.md#Resend Integration]
- [Source: prd.md#FR4, FR5, FR6]
- [Source: epics.md#Story 2.5]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
