# Story 11.3: Désactivation/Réactivation Compte Créateur

Status: ready-for-dev

## Story

As a Admin,
I want désactiver ou réactiver un compte créateur,
so that je puisse gérer les violations de CGU ou les demandes de suspension.

## Acceptance Criteria

1. **AC1 - Bouton désactivation avec motif**
   - **Given** un Admin sur le détail d'un créateur ACTIVE
   - **When** il clique sur "Désactiver le compte"
   - **Then** une modale s'ouvre demandant un motif obligatoire
   - **And** il doit sélectionner une catégorie (CGU, Fraude, Demande créateur, Autre)

2. **AC2 - Confirmation de désactivation**
   - **Given** un Admin qui confirme la désactivation
   - **When** il valide
   - **Then** le statut du créateur passe à SUSPENDED
   - **And** la boutique du créateur est masquée
   - **And** les produits ne sont plus visibles

3. **AC3 - Email notification au créateur**
   - **Given** un créateur dont le compte est désactivé
   - **When** la désactivation est confirmée
   - **Then** un email est envoyé avec le motif et les démarches pour contester

4. **AC4 - Réactivation du compte**
   - **Given** un Admin sur le détail d'un créateur SUSPENDED
   - **When** il clique sur "Réactiver le compte"
   - **Then** une modale demande confirmation et motif optionnel
   - **And** le statut repasse à ACTIVE
   - **And** la boutique et les produits redeviennent visibles

5. **AC5 - Historique des actions**
   - **Given** un Admin sur le détail d'un créateur
   - **When** il consulte l'historique
   - **Then** il voit toutes les suspensions/réactivations avec date, admin, et motif

## Tasks / Subtasks

- [ ] **Task 1: Créer les modales d'action** (AC: #1, #4)
  - [ ] 1.1 Créer `SuspendCreatorModal` avec formulaire motif
  - [ ] 1.2 Créer `ReactivateCreatorModal` avec confirmation
  - [ ] 1.3 Ajouter validation du motif obligatoire pour suspension
  - [ ] 1.4 Intégrer les catégories de suspension

- [ ] **Task 2: Implémenter SuspendCreatorUseCase** (AC: #2)
  - [ ] 2.1 Créer `src/modules/admin/application/use-cases/suspend-creator.use-case.ts`
  - [ ] 2.2 Mettre à jour le statut créateur à SUSPENDED
  - [ ] 2.3 Masquer la boutique (isPublished = false)
  - [ ] 2.4 Masquer les produits (status = HIDDEN)
  - [ ] 2.5 Créer l'entrée dans AuditLog

- [ ] **Task 3: Implémenter ReactivateCreatorUseCase** (AC: #4)
  - [ ] 3.1 Créer `src/modules/admin/application/use-cases/reactivate-creator.use-case.ts`
  - [ ] 3.2 Mettre à jour le statut créateur à ACTIVE
  - [ ] 3.3 Restaurer la visibilité de la boutique
  - [ ] 3.4 Restaurer les produits à leur état précédent
  - [ ] 3.5 Créer l'entrée dans AuditLog

- [ ] **Task 4: Implémenter les emails** (AC: #3)
  - [ ] 4.1 Créer template email `creator-suspended`
  - [ ] 4.2 Créer template email `creator-reactivated`
  - [ ] 4.3 Inclure les informations de contestation

- [ ] **Task 5: Afficher l'historique des actions** (AC: #5)
  - [ ] 5.1 Créer composant `CreatorActivityLog`
  - [ ] 5.2 Requêter les AuditLogs liés au créateur
  - [ ] 5.3 Afficher avec timeline visuelle

- [ ] **Task 6: Écrire les tests** (AC: #1-5)
  - [ ] 6.1 Tests unitaires pour les use cases
  - [ ] 6.2 Tests d'intégration pour les API
  - [ ] 6.3 Tests des notifications email

## Dev Notes

### Modal Suspension

```typescript
// src/app/(admin)/admin/creators/[id]/components/SuspendCreatorModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

const suspensionCategories = [
  { value: "CGU_VIOLATION", label: "Violation des CGU" },
  { value: "FRAUD", label: "Fraude suspectée" },
  { value: "CREATOR_REQUEST", label: "Demande du créateur" },
  { value: "OTHER", label: "Autre motif" },
];

interface SuspendCreatorModalProps {
  creatorId: string;
  brandName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SuspendCreatorModal({
  creatorId,
  brandName,
  open,
  onOpenChange,
}: SuspendCreatorModalProps) {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!category || !reason.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/creators/${creatorId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, reason }),
      });

      if (response.ok) {
        onOpenChange(false);
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Désactiver le compte
          </DialogTitle>
          <DialogDescription>
            Vous êtes sur le point de désactiver le compte de{" "}
            <strong>{brandName}</strong>. Cette action masquera sa boutique et
            tous ses produits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Catégorie de suspension *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {suspensionCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Motif détaillé *</Label>
            <Textarea
              placeholder="Expliquez la raison de cette suspension..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Ce motif sera inclus dans l'email envoyé au créateur.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!category || !reason.trim() || isSubmitting}
          >
            {isSubmitting ? "Désactivation..." : "Désactiver le compte"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Use Case SuspendCreator

```typescript
// src/modules/admin/application/use-cases/suspend-creator.use-case.ts
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { Result } from "@/lib/result";

interface SuspendCreatorDTO {
  creatorId: string;
  adminId: string;
  category: "CGU_VIOLATION" | "FRAUD" | "CREATOR_REQUEST" | "OTHER";
  reason: string;
}

export async function suspendCreator(dto: SuspendCreatorDTO): Promise<Result<void>> {
  const { creatorId, adminId, category, reason } = dto;

  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
    include: {
      user: { select: { email: true, name: true } },
      page: true,
    },
  });

  if (!creator) {
    return Result.fail("Créateur non trouvé");
  }

  if (creator.status === "SUSPENDED") {
    return Result.fail("Ce compte est déjà suspendu");
  }

  // Transaction pour tout mettre à jour atomiquement
  await prisma.$transaction(async (tx) => {
    // 1. Suspendre le créateur
    await tx.creator.update({
      where: { id: creatorId },
      data: { status: "SUSPENDED" },
    });

    // 2. Masquer la page/boutique
    if (creator.page) {
      await tx.creatorPage.update({
        where: { id: creator.page.id },
        data: { isPublished: false },
      });
    }

    // 3. Masquer tous les produits (sauvegarder l'état précédent)
    await tx.product.updateMany({
      where: {
        creatorId,
        status: { not: "HIDDEN" },
      },
      data: {
        status: "HIDDEN",
        previousStatus: prisma.product.fields.status, // Stocker l'état précédent
      },
    });

    // 4. Créer le log d'audit
    await tx.auditLog.create({
      data: {
        action: "CREATOR_SUSPENDED",
        entityType: "Creator",
        entityId: creatorId,
        adminId,
        changes: {
          previousStatus: creator.status,
          newStatus: "SUSPENDED",
          category,
        },
        reason,
      },
    });
  });

  // 5. Envoyer l'email de notification
  await sendEmail({
    to: creator.user.email,
    template: "creator-suspended",
    data: {
      name: creator.user.name,
      brandName: creator.brandName,
      category: getCategoryLabel(category),
      reason,
      contestUrl: `${process.env.APP_URL}/support/contest`,
    },
  });

  return Result.ok();
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    CGU_VIOLATION: "Violation des Conditions Générales d'Utilisation",
    FRAUD: "Activité frauduleuse suspectée",
    CREATOR_REQUEST: "À votre demande",
    OTHER: "Autre motif",
  };
  return labels[category] || category;
}
```

### Use Case ReactivateCreator

```typescript
// src/modules/admin/application/use-cases/reactivate-creator.use-case.ts
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { Result } from "@/lib/result";

interface ReactivateCreatorDTO {
  creatorId: string;
  adminId: string;
  reason?: string;
}

export async function reactivateCreator(dto: ReactivateCreatorDTO): Promise<Result<void>> {
  const { creatorId, adminId, reason } = dto;

  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
    include: {
      user: { select: { email: true, name: true } },
      page: true,
    },
  });

  if (!creator) {
    return Result.fail("Créateur non trouvé");
  }

  if (creator.status !== "SUSPENDED") {
    return Result.fail("Ce compte n'est pas suspendu");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Réactiver le créateur
    await tx.creator.update({
      where: { id: creatorId },
      data: { status: "ACTIVE" },
    });

    // 2. Republier la page si elle était publiée avant
    if (creator.page) {
      await tx.creatorPage.update({
        where: { id: creator.page.id },
        data: { isPublished: true },
      });
    }

    // 3. Restaurer les produits à leur état précédent
    const hiddenProducts = await tx.product.findMany({
      where: {
        creatorId,
        status: "HIDDEN",
        previousStatus: { not: null },
      },
    });

    for (const product of hiddenProducts) {
      await tx.product.update({
        where: { id: product.id },
        data: {
          status: product.previousStatus || "DRAFT",
          previousStatus: null,
        },
      });
    }

    // 4. Créer le log d'audit
    await tx.auditLog.create({
      data: {
        action: "CREATOR_REACTIVATED",
        entityType: "Creator",
        entityId: creatorId,
        adminId,
        changes: {
          previousStatus: "SUSPENDED",
          newStatus: "ACTIVE",
        },
        reason: reason || "Réactivation manuelle",
      },
    });
  });

  // 5. Envoyer l'email de notification
  await sendEmail({
    to: creator.user.email,
    template: "creator-reactivated",
    data: {
      name: creator.user.name,
      brandName: creator.brandName,
      dashboardUrl: `${process.env.APP_URL}/creator/dashboard`,
    },
  });

  return Result.ok();
}
```

### Template Email Suspension

```typescript
// src/lib/email/templates/creator-suspended.tsx
import { EmailTemplate } from "../components";

interface CreatorSuspendedEmailProps {
  name: string;
  brandName: string;
  category: string;
  reason: string;
  contestUrl: string;
}

export function CreatorSuspendedEmail({
  name,
  brandName,
  category,
  reason,
  contestUrl,
}: CreatorSuspendedEmailProps) {
  return (
    <EmailTemplate subject={`Votre compte ${brandName} a été suspendu`}>
      <h1>Bonjour {name},</h1>

      <p>
        Nous vous informons que votre compte créateur <strong>{brandName}</strong>
        a été temporairement suspendu.
      </p>

      <div className="alert alert-warning">
        <h3>Motif de la suspension</h3>
        <p><strong>Catégorie :</strong> {category}</p>
        <p><strong>Détails :</strong> {reason}</p>
      </div>

      <h2>Conséquences</h2>
      <ul>
        <li>Votre boutique n'est plus visible par les clients</li>
        <li>Vos produits sont temporairement masqués</li>
        <li>Les commandes en cours restent actives</li>
      </ul>

      <h2>Contester cette décision</h2>
      <p>
        Si vous pensez que cette suspension est une erreur, vous pouvez la
        contester en nous contactant.
      </p>

      <a href={contestUrl} className="button">
        Contester la suspension
      </a>

      <p className="footer">
        L'équipe Tyler
      </p>
    </EmailTemplate>
  );
}
```

### Composant Historique Actions

```typescript
// src/app/(admin)/admin/creators/[id]/components/CreatorActivityLog.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/format";
import { Ban, CheckCircle, Edit, AlertTriangle } from "lucide-react";

interface AuditLogEntry {
  id: string;
  action: string;
  admin: { name: string };
  reason: string | null;
  changes: Record<string, any>;
  createdAt: Date;
}

const actionConfig: Record<string, { icon: any; label: string; variant: string }> = {
  CREATOR_SUSPENDED: {
    icon: Ban,
    label: "Compte suspendu",
    variant: "destructive",
  },
  CREATOR_REACTIVATED: {
    icon: CheckCircle,
    label: "Compte réactivé",
    variant: "success",
  },
  CREATOR_UPDATED: {
    icon: Edit,
    label: "Informations modifiées",
    variant: "secondary",
  },
};

export function CreatorActivityLog({ logs }: { logs: AuditLogEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des actions</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Aucune action enregistrée
          </p>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <ul className="space-y-4">
              {logs.map((log) => {
                const config = actionConfig[log.action] || {
                  icon: AlertTriangle,
                  label: log.action,
                  variant: "secondary",
                };
                const Icon = config.icon;

                return (
                  <li key={log.id} className="relative pl-10">
                    <div className="absolute left-2 w-4 h-4 rounded-full bg-background border-2 flex items-center justify-center">
                      <Icon className="h-2 w-2" />
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={config.variant as any}>
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          par {log.admin.name}
                        </span>
                      </div>
                      <p className="text-sm">{log.reason}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(log.createdAt, "PPpp")}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Références

- [Source: architecture.md#Admin Module]
- [Source: prd.md#FR13, FR14]
- [Source: epics.md#Epic 11 - Administration]
- [Story: 11.2 - Liste créateurs]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
