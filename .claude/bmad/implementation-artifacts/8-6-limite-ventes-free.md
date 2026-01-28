# Story 8.6: Limite de Ventes FREE

Status: ready-for-dev

## Story

As a systeme,
I want bloquer les commandes si un createur FREE a atteint 10 ventes,
so that les limites du plan gratuit soient respectees.

## Acceptance Criteria

1. **AC1 - Blocage commandes si limite atteinte**
   - **Given** un createur avec plan FREE et 10 ventes
   - **When** un visiteur tente de passer commande
   - **Then** la commande est bloquee
   - **And** un message explicite est affiche

2. **AC2 - Message visiteur**
   - **Given** la boutique d'un createur FREE avec 10 ventes
   - **When** un visiteur consulte un produit
   - **Then** le message "Ce createur a atteint sa limite de ventes" est affiche
   - **And** le bouton "Ajouter au panier" est desactive

3. **AC3 - Notification createur**
   - **Given** un createur FREE qui atteint 9 ventes
   - **When** la 9eme vente est validee
   - **Then** le createur recoit une notification
   - **And** la notification suggere d'upgrader vers PRO

4. **AC4 - Notification limite atteinte**
   - **Given** un createur FREE qui atteint 10 ventes
   - **When** la 10eme vente est validee
   - **Then** le createur recoit une notification urgente
   - **And** un email est envoye avec le lien d'upgrade

5. **AC5 - Deblocage apres upgrade**
   - **Given** un createur FREE avec 10 ventes
   - **When** il passe au plan PRO
   - **Then** les commandes sont de nouveau acceptees
   - **And** le compteur de ventes continue normalement

## Tasks / Subtasks

- [ ] **Task 1: Creer le service de verification limites** (AC: #1)
  - [ ] 1.1 Creer `src/modules/subscriptions/application/services/sales-limit.service.ts`
  - [ ] 1.2 Implementer la verification du nombre de ventes
  - [ ] 1.3 Definir les limites par plan

- [ ] **Task 2: Creer le guard de commande** (AC: #1)
  - [ ] 2.1 Creer `src/modules/orders/application/guards/sales-limit.guard.ts`
  - [ ] 2.2 Bloquer la creation de commande si limite atteinte
  - [ ] 2.3 Retourner une erreur explicite

- [ ] **Task 3: Afficher le message sur la page produit** (AC: #2)
  - [ ] 3.1 Modifier le composant ProductDetails
  - [ ] 3.2 Afficher l'avertissement si limite atteinte
  - [ ] 3.3 Desactiver le bouton panier

- [ ] **Task 4: Creer le systeme de notifications** (AC: #3, #4)
  - [ ] 4.1 Creer `src/modules/notifications/application/services/sales-limit-notification.service.ts`
  - [ ] 4.2 Notifier a 9 ventes (warning)
  - [ ] 4.3 Notifier a 10 ventes (alerte)
  - [ ] 4.4 Creer les templates email

- [ ] **Task 5: Mettre a jour le compteur de ventes** (AC: #1, #5)
  - [ ] 5.1 Incrementer le compteur apres chaque vente
  - [ ] 5.2 Verifier les limites apres increment
  - [ ] 5.3 Declencher les notifications si necessaire

- [ ] **Task 6: Integrer avec le systeme d'upgrade** (AC: #5)
  - [ ] 6.1 Verifier que l'upgrade reset les restrictions
  - [ ] 6.2 Tester le parcours complet

- [ ] **Task 7: Ecrire les tests** (AC: #1-5)
  - [ ] 7.1 Tests unitaires pour SalesLimitService
  - [ ] 7.2 Tests unitaires pour le guard
  - [ ] 7.3 Tests d'integration

## Dev Notes

### Configuration des Limites par Plan

```typescript
// src/modules/subscriptions/domain/config/plan-limits.config.ts
import { SubscriptionPlan } from "../value-objects/subscription-plan.vo";

export interface PlanLimits {
  maxProducts: number;
  maxSalesPerMonth: number;
  maxImagesPerProduct: number;
  commissionRate: number; // en pourcentage
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  FREE: {
    maxProducts: 5,
    maxSalesPerMonth: 10,
    maxImagesPerProduct: 3,
    commissionRate: 10,
  },
  PRO: {
    maxProducts: Infinity,
    maxSalesPerMonth: Infinity,
    maxImagesPerProduct: 10,
    commissionRate: 5,
  },
};

export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  return PLAN_LIMITS[plan];
}
```

### Service de Verification des Limites

```typescript
// src/modules/subscriptions/application/services/sales-limit.service.ts
import { injectable, inject } from "tsyringe";
import { ICreatorRepository } from "@/modules/creators/domain/repositories/creator.repository.interface";
import { IOrderRepository } from "@/modules/orders/domain/repositories/order.repository.interface";
import { getPlanLimits } from "../../domain/config/plan-limits.config";

interface SalesLimitStatus {
  currentSales: number;
  maxSales: number;
  isLimitReached: boolean;
  remainingSales: number;
  shouldNotify: boolean;
  notificationType: "warning" | "limit_reached" | null;
}

@injectable()
export class SalesLimitService {
  constructor(
    @inject("ICreatorRepository")
    private creatorRepository: ICreatorRepository,
    @inject("IOrderRepository")
    private orderRepository: IOrderRepository
  ) {}

  async checkSalesLimit(creatorId: string): Promise<SalesLimitStatus> {
    const creator = await this.creatorRepository.findById(creatorId);

    if (!creator) {
      throw new Error("Createur non trouve");
    }

    const limits = getPlanLimits(creator.subscriptionPlan);

    // Plan PRO has no limits
    if (limits.maxSalesPerMonth === Infinity) {
      return {
        currentSales: creator.salesThisMonth,
        maxSales: Infinity,
        isLimitReached: false,
        remainingSales: Infinity,
        shouldNotify: false,
        notificationType: null,
      };
    }

    const currentSales = await this.getSalesThisMonth(creatorId);
    const isLimitReached = currentSales >= limits.maxSalesPerMonth;
    const remainingSales = Math.max(0, limits.maxSalesPerMonth - currentSales);

    // Determine notification type
    let notificationType: "warning" | "limit_reached" | null = null;
    if (currentSales === limits.maxSalesPerMonth) {
      notificationType = "limit_reached";
    } else if (currentSales === limits.maxSalesPerMonth - 1) {
      notificationType = "warning";
    }

    return {
      currentSales,
      maxSales: limits.maxSalesPerMonth,
      isLimitReached,
      remainingSales,
      shouldNotify: notificationType !== null,
      notificationType,
    };
  }

  async canAcceptOrder(creatorId: string): Promise<{ allowed: boolean; reason?: string }> {
    const status = await this.checkSalesLimit(creatorId);

    if (status.isLimitReached) {
      return {
        allowed: false,
        reason: "Ce createur a atteint sa limite mensuelle de ventes. Revenez le mois prochain ou contactez le createur.",
      };
    }

    return { allowed: true };
  }

  private async getSalesThisMonth(creatorId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return this.orderRepository.countByCreator({
      creatorId,
      startDate: startOfMonth,
      endDate: endOfMonth,
      statuses: ["PAID", "SHIPPED", "DELIVERED"],
    });
  }
}
```

### Guard de Commande

```typescript
// src/modules/orders/application/guards/sales-limit.guard.ts
import { injectable, inject } from "tsyringe";
import { SalesLimitService } from "@/modules/subscriptions/application/services/sales-limit.service";
import { SalesLimitExceededError } from "@/shared/errors";

@injectable()
export class SalesLimitGuard {
  constructor(
    @inject("SalesLimitService")
    private salesLimitService: SalesLimitService
  ) {}

  async check(creatorId: string): Promise<void> {
    const result = await this.salesLimitService.canAcceptOrder(creatorId);

    if (!result.allowed) {
      throw new SalesLimitExceededError(result.reason!);
    }
  }
}
```

### Error Personnalisee

```typescript
// src/shared/errors/sales-limit-exceeded.error.ts
export class SalesLimitExceededError extends Error {
  public readonly code = "SALES_LIMIT_EXCEEDED";

  constructor(message: string) {
    super(message);
    this.name = "SalesLimitExceededError";
  }
}
```

### Integration dans CreateOrder UseCase

```typescript
// src/modules/orders/application/use-cases/create-order.use-case.ts
import { injectable, inject } from "tsyringe";
import { SalesLimitGuard } from "../guards/sales-limit.guard";
import { SalesLimitNotificationService } from "@/modules/notifications/application/services/sales-limit-notification.service";
// ... autres imports

@injectable()
export class CreateOrderUseCase {
  constructor(
    @inject("IOrderRepository")
    private orderRepository: IOrderRepository,
    @inject("SalesLimitGuard")
    private salesLimitGuard: SalesLimitGuard,
    @inject("SalesLimitService")
    private salesLimitService: SalesLimitService,
    @inject("SalesLimitNotificationService")
    private notificationService: SalesLimitNotificationService
    // ... autres deps
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    // Check sales limit BEFORE processing
    await this.salesLimitGuard.check(input.creatorId);

    // ... creation de la commande

    // After successful order creation, check if notification needed
    const status = await this.salesLimitService.checkSalesLimit(input.creatorId);

    if (status.shouldNotify) {
      await this.notificationService.notifyCreator({
        creatorId: input.creatorId,
        type: status.notificationType!,
        currentSales: status.currentSales,
        maxSales: status.maxSales,
      });
    }

    return result;
  }
}
```

### Service de Notification

```typescript
// src/modules/notifications/application/services/sales-limit-notification.service.ts
import { injectable, inject } from "tsyringe";
import { ICreatorRepository } from "@/modules/creators/domain/repositories/creator.repository.interface";
import { IEmailService } from "../../domain/services/email.service.interface";
import { INotificationRepository } from "../../domain/repositories/notification.repository.interface";

interface NotifyCreatorInput {
  creatorId: string;
  type: "warning" | "limit_reached";
  currentSales: number;
  maxSales: number;
}

@injectable()
export class SalesLimitNotificationService {
  constructor(
    @inject("ICreatorRepository")
    private creatorRepository: ICreatorRepository,
    @inject("IEmailService")
    private emailService: IEmailService,
    @inject("INotificationRepository")
    private notificationRepository: INotificationRepository
  ) {}

  async notifyCreator(input: NotifyCreatorInput): Promise<void> {
    const creator = await this.creatorRepository.findById(input.creatorId);
    if (!creator) return;

    if (input.type === "warning") {
      await this.sendWarningNotification(creator, input);
    } else {
      await this.sendLimitReachedNotification(creator, input);
    }
  }

  private async sendWarningNotification(
    creator: Creator,
    input: NotifyCreatorInput
  ): Promise<void> {
    // In-app notification
    await this.notificationRepository.create({
      userId: creator.userId,
      type: "SALES_LIMIT_WARNING",
      title: "Vous approchez de votre limite de ventes",
      message: `Vous avez realise ${input.currentSales} ventes ce mois-ci. Plus qu'une vente disponible avec votre plan FREE.`,
      data: {
        currentSales: input.currentSales,
        maxSales: input.maxSales,
        upgradeUrl: "/dashboard/subscription/upgrade",
      },
    });

    // Email notification
    await this.emailService.send({
      to: creator.email,
      subject: "Plus qu'une vente disponible ce mois-ci",
      template: "sales-limit-warning",
      data: {
        creatorName: creator.brandName,
        currentSales: input.currentSales,
        maxSales: input.maxSales,
        upgradeUrl: `${process.env.APP_URL}/dashboard/subscription/upgrade`,
      },
    });
  }

  private async sendLimitReachedNotification(
    creator: Creator,
    input: NotifyCreatorInput
  ): Promise<void> {
    // In-app notification (urgent)
    await this.notificationRepository.create({
      userId: creator.userId,
      type: "SALES_LIMIT_REACHED",
      title: "Limite de ventes atteinte",
      message: `Vous avez atteint votre limite de ${input.maxSales} ventes ce mois-ci. Passez au plan PRO pour continuer a vendre.`,
      priority: "high",
      data: {
        currentSales: input.currentSales,
        maxSales: input.maxSales,
        upgradeUrl: "/dashboard/subscription/upgrade",
      },
    });

    // Email notification (urgent)
    await this.emailService.send({
      to: creator.email,
      subject: "Limite de ventes atteinte - Passez au plan PRO",
      template: "sales-limit-reached",
      data: {
        creatorName: creator.brandName,
        currentSales: input.currentSales,
        maxSales: input.maxSales,
        upgradeUrl: `${process.env.APP_URL}/dashboard/subscription/upgrade`,
      },
    });
  }
}
```

### Composant Avertissement Page Produit

```typescript
// src/components/products/sales-limit-warning.tsx
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SalesLimitWarningProps {
  creatorName: string;
}

export function SalesLimitWarning({ creatorName }: SalesLimitWarningProps) {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Boutique temporairement indisponible</AlertTitle>
      <AlertDescription>
        {creatorName} a atteint sa limite mensuelle de ventes.
        Les commandes seront de nouveau possibles le mois prochain.
      </AlertDescription>
    </Alert>
  );
}
```

### Modification Page Produit Publique

```typescript
// src/app/(public)/[slug]/products/[productId]/page.tsx
import { SalesLimitWarning } from "@/components/products/sales-limit-warning";
import { SalesLimitService } from "@/modules/subscriptions/application/services/sales-limit.service";

export default async function ProductPage({ params }: Props) {
  const { slug, productId } = await params;

  // ... fetch product and creator

  // Check sales limit
  const salesLimitService = container.resolve(SalesLimitService);
  const salesStatus = await salesLimitService.checkSalesLimit(creator.id);

  return (
    <div>
      {salesStatus.isLimitReached && (
        <SalesLimitWarning creatorName={creator.brandName} />
      )}

      <ProductDetails
        product={product}
        disabled={salesStatus.isLimitReached}
      />

      {!salesStatus.isLimitReached ? (
        <AddToCartButton product={product} />
      ) : (
        <Button disabled className="w-full">
          Indisponible - Limite de ventes atteinte
        </Button>
      )}
    </div>
  );
}
```

### Template Email Limite Atteinte

```typescript
// src/emails/sales-limit-reached.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface SalesLimitReachedEmailProps {
  creatorName: string;
  currentSales: number;
  maxSales: number;
  upgradeUrl: string;
}

export function SalesLimitReachedEmail({
  creatorName,
  currentSales,
  maxSales,
  upgradeUrl,
}: SalesLimitReachedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Limite de ventes atteinte - Passez au plan PRO</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Limite de ventes atteinte</Heading>

          <Text style={text}>
            Bonjour {creatorName},
          </Text>

          <Text style={text}>
            Felicitations ! Vous avez realise <strong>{currentSales} ventes</strong> ce mois-ci
            et atteint la limite de votre plan FREE.
          </Text>

          <Section style={alertSection}>
            <Text style={alertText}>
              Votre boutique est temporairement suspendue.
              Vos clients ne peuvent plus passer de commandes jusqu'au mois prochain.
            </Text>
          </Section>

          <Text style={text}>
            Pour continuer a vendre sans limite, passez au plan PRO :
          </Text>

          <Section style={benefitsSection}>
            <Text style={benefitItem}>Ventes illimitees</Text>
            <Text style={benefitItem}>Commission reduite a 5%</Text>
            <Text style={benefitItem}>Produits illimites</Text>
            <Text style={benefitItem}>10 images par produit</Text>
          </Section>

          <Button style={button} href={upgradeUrl}>
            Passer au plan PRO - 9,99/mois
          </Button>

          <Text style={footer}>
            Merci de faire partie de la communaute Kpsull !
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "sans-serif" };
const container = { backgroundColor: "#ffffff", margin: "0 auto", padding: "40px", borderRadius: "8px" };
const h1 = { color: "#dc2626", fontSize: "24px" };
const text = { color: "#555", fontSize: "16px", lineHeight: "24px" };
const alertSection = { backgroundColor: "#fef2f2", padding: "20px", borderRadius: "8px", margin: "20px 0", borderLeft: "4px solid #dc2626" };
const alertText = { color: "#991b1b", fontSize: "14px", margin: "0" };
const benefitsSection = { backgroundColor: "#f0fdf4", padding: "20px", borderRadius: "8px", margin: "20px 0" };
const benefitItem = { color: "#166534", fontSize: "14px", margin: "8px 0", paddingLeft: "20px" };
const button = { backgroundColor: "#000", color: "#fff", padding: "16px 32px", borderRadius: "8px", textDecoration: "none", display: "inline-block" };
const footer = { color: "#888", fontSize: "14px", marginTop: "32px" };
```

### Tests

```typescript
// src/modules/subscriptions/application/services/__tests__/sales-limit.service.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { SalesLimitService } from "../sales-limit.service";
import { mockCreatorRepository, mockOrderRepository } from "@/test/mocks";

describe("SalesLimitService", () => {
  let service: SalesLimitService;

  beforeEach(() => {
    service = new SalesLimitService(mockCreatorRepository, mockOrderRepository);
  });

  describe("checkSalesLimit", () => {
    it("should return no limit for PRO plan", async () => {
      mockCreatorRepository.findById.mockResolvedValue({
        id: "creator-1",
        subscriptionPlan: "PRO",
        salesThisMonth: 100,
      });

      const result = await service.checkSalesLimit("creator-1");

      expect(result.isLimitReached).toBe(false);
      expect(result.maxSales).toBe(Infinity);
    });

    it("should return limit reached for FREE plan at 10 sales", async () => {
      mockCreatorRepository.findById.mockResolvedValue({
        id: "creator-1",
        subscriptionPlan: "FREE",
      });
      mockOrderRepository.countByCreator.mockResolvedValue(10);

      const result = await service.checkSalesLimit("creator-1");

      expect(result.isLimitReached).toBe(true);
      expect(result.currentSales).toBe(10);
      expect(result.maxSales).toBe(10);
      expect(result.notificationType).toBe("limit_reached");
    });

    it("should return warning at 9 sales", async () => {
      mockCreatorRepository.findById.mockResolvedValue({
        id: "creator-1",
        subscriptionPlan: "FREE",
      });
      mockOrderRepository.countByCreator.mockResolvedValue(9);

      const result = await service.checkSalesLimit("creator-1");

      expect(result.isLimitReached).toBe(false);
      expect(result.remainingSales).toBe(1);
      expect(result.notificationType).toBe("warning");
    });
  });

  describe("canAcceptOrder", () => {
    it("should allow order when under limit", async () => {
      mockCreatorRepository.findById.mockResolvedValue({
        id: "creator-1",
        subscriptionPlan: "FREE",
      });
      mockOrderRepository.countByCreator.mockResolvedValue(5);

      const result = await service.canAcceptOrder("creator-1");

      expect(result.allowed).toBe(true);
    });

    it("should block order when limit reached", async () => {
      mockCreatorRepository.findById.mockResolvedValue({
        id: "creator-1",
        subscriptionPlan: "FREE",
      });
      mockOrderRepository.countByCreator.mockResolvedValue(10);

      const result = await service.canAcceptOrder("creator-1");

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("limite mensuelle");
    });
  });
});
```

### References

- [Source: architecture.md#Subscription Limits]
- [Source: prd.md#FR40 - Limite ventes FREE]
- [Source: epics.md#Story 8.6]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
