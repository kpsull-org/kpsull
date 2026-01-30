# Story 11.4: Notification Nouveaux Créateurs

Status: ready-for-dev

## Story

As a Admin,
I want être notifié des nouveaux créateurs en attente de vérification,
so that je puisse traiter rapidement les demandes d'inscription.

## Acceptance Criteria

1. **AC1 - Badge de notification**
   - **Given** un Admin connecté
   - **When** il consulte le menu admin
   - **Then** il voit un badge "X nouveaux" sur l'entrée "Créateurs"
   - **And** le badge affiche le nombre de créateurs PENDING_VERIFICATION

2. **AC2 - Liste des créateurs en attente**
   - **Given** un Admin sur la page créateurs
   - **When** il clique sur le filtre "En attente"
   - **Then** il voit uniquement les créateurs avec statut PENDING_VERIFICATION
   - **And** ils sont triés par date d'inscription (plus ancien en premier)

3. **AC3 - Actions rapides de vérification**
   - **Given** un Admin sur un créateur en attente
   - **When** il consulte le détail
   - **Then** il peut "Approuver" ou "Rejeter" avec un motif

4. **AC4 - Mise à jour temps réel du badge**
   - **Given** un Admin qui approuve un créateur
   - **When** l'approbation est confirmée
   - **Then** le badge se met à jour sans rechargement de page

5. **AC5 - Email d'approbation/rejet**
   - **Given** un Admin qui traite une demande
   - **When** il approuve ou rejette
   - **Then** le créateur reçoit un email avec le résultat

## Tasks / Subtasks

- [ ] **Task 1: Implémenter le badge de notification** (AC: #1, #4)
  - [ ] 1.1 Créer `AdminNotificationBadge` component
  - [ ] 1.2 Créer l'API `GET /api/admin/notifications/pending-count`
  - [ ] 1.3 Implémenter le polling ou SSE pour mise à jour temps réel
  - [ ] 1.4 Intégrer dans le menu sidebar admin

- [ ] **Task 2: Créer la vue filtrée créateurs en attente** (AC: #2)
  - [ ] 2.1 Ajouter le preset de filtre "En attente de vérification"
  - [ ] 2.2 Trier par date d'inscription ascendante
  - [ ] 2.3 Mettre en évidence visuellement les demandes urgentes (> 48h)

- [ ] **Task 3: Implémenter les actions de vérification** (AC: #3)
  - [ ] 3.1 Créer `ApproveCreatorUseCase`
  - [ ] 3.2 Créer `RejectCreatorUseCase`
  - [ ] 3.3 Créer les modales d'approbation/rejet
  - [ ] 3.4 Implémenter les routes API

- [ ] **Task 4: Implémenter les emails** (AC: #5)
  - [ ] 4.1 Créer template `creator-approved`
  - [ ] 4.2 Créer template `creator-rejected`

- [ ] **Task 5: Écrire les tests** (AC: #1-5)
  - [ ] 5.1 Tests unitaires pour les use cases
  - [ ] 5.2 Tests pour le badge et mise à jour temps réel
  - [ ] 5.3 Tests d'envoi d'emails

## Dev Notes

### Badge Notification Admin

```typescript
// src/components/admin/AdminNotificationBadge.tsx
"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface AdminNotificationBadgeProps {
  className?: string;
}

export function AdminNotificationBadge({ className }: AdminNotificationBadgeProps) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Initial fetch
    fetchPendingCount();

    // Polling every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchPendingCount = async () => {
    try {
      const response = await fetch("/api/admin/notifications/pending-count");
      if (response.ok) {
        const data = await response.json();
        setPendingCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch pending count:", error);
    }
  };

  if (pendingCount === 0) return null;

  return (
    <Badge variant="destructive" className={className}>
      {pendingCount > 99 ? "99+" : pendingCount}
    </Badge>
  );
}
```

### Sidebar Admin avec Badge

```typescript
// src/components/admin/AdminSidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Flag,
  Settings,
  FileText,
} from "lucide-react";
import { AdminNotificationBadge } from "./AdminNotificationBadge";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/creators",
    label: "Créateurs",
    icon: Users,
    showBadge: true,
  },
  {
    href: "/admin/orders",
    label: "Commandes",
    icon: ShoppingBag,
  },
  {
    href: "/admin/moderation",
    label: "Modération",
    icon: Flag,
  },
  {
    href: "/admin/reports",
    label: "Rapports",
    icon: FileText,
  },
  {
    href: "/admin/settings",
    label: "Paramètres",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-card border-r h-screen sticky top-0">
      <div className="p-6">
        <h2 className="text-xl font-bold">Admin Tyler</h2>
      </div>
      <nav className="px-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.showBadge && (
                    <AdminNotificationBadge />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
```

### API Route Pending Count

```typescript
// src/app/api/admin/notifications/pending-count/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await prisma.creator.count({
    where: { status: "PENDING_VERIFICATION" },
  });

  return NextResponse.json({ count });
}
```

### Use Case ApproveCreator

```typescript
// src/modules/admin/application/use-cases/approve-creator.use-case.ts
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { Result } from "@/lib/result";

interface ApproveCreatorDTO {
  creatorId: string;
  adminId: string;
  notes?: string;
}

export async function approveCreator(dto: ApproveCreatorDTO): Promise<Result<void>> {
  const { creatorId, adminId, notes } = dto;

  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  if (!creator) {
    return Result.fail("Créateur non trouvé");
  }

  if (creator.status !== "PENDING_VERIFICATION") {
    return Result.fail("Ce créateur n'est pas en attente de vérification");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Approuver le créateur
    await tx.creator.update({
      where: { id: creatorId },
      data: { status: "ACTIVE" },
    });

    // 2. Créer le log d'audit
    await tx.auditLog.create({
      data: {
        action: "CREATOR_APPROVED",
        entityType: "Creator",
        entityId: creatorId,
        adminId,
        changes: {
          previousStatus: "PENDING_VERIFICATION",
          newStatus: "ACTIVE",
        },
        reason: notes || "Vérification validée",
      },
    });
  });

  // 3. Envoyer l'email de bienvenue
  await sendEmail({
    to: creator.user.email,
    template: "creator-approved",
    data: {
      name: creator.user.name,
      brandName: creator.brandName,
      dashboardUrl: `${process.env.APP_URL}/creator/dashboard`,
      guideUrl: `${process.env.APP_URL}/creator/guide`,
    },
  });

  return Result.ok();
}
```

### Use Case RejectCreator

```typescript
// src/modules/admin/application/use-cases/reject-creator.use-case.ts
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { Result } from "@/lib/result";

interface RejectCreatorDTO {
  creatorId: string;
  adminId: string;
  reason: string;
}

export async function rejectCreator(dto: RejectCreatorDTO): Promise<Result<void>> {
  const { creatorId, adminId, reason } = dto;

  if (!reason.trim()) {
    return Result.fail("Un motif de rejet est obligatoire");
  }

  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  if (!creator) {
    return Result.fail("Créateur non trouvé");
  }

  if (creator.status !== "PENDING_VERIFICATION") {
    return Result.fail("Ce créateur n'est pas en attente de vérification");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Rejeter le créateur
    await tx.creator.update({
      where: { id: creatorId },
      data: { status: "REJECTED" },
    });

    // 2. Créer le log d'audit
    await tx.auditLog.create({
      data: {
        action: "CREATOR_REJECTED",
        entityType: "Creator",
        entityId: creatorId,
        adminId,
        changes: {
          previousStatus: "PENDING_VERIFICATION",
          newStatus: "REJECTED",
        },
        reason,
      },
    });
  });

  // 3. Envoyer l'email de notification
  await sendEmail({
    to: creator.user.email,
    template: "creator-rejected",
    data: {
      name: creator.user.name,
      brandName: creator.brandName,
      reason,
      supportUrl: `${process.env.APP_URL}/support`,
    },
  });

  return Result.ok();
}
```

### Modal Vérification Créateur

```typescript
// src/app/(admin)/admin/creators/[id]/components/VerificationActions.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";

interface VerificationActionsProps {
  creatorId: string;
  brandName: string;
}

export function VerificationActions({ creatorId, brandName }: VerificationActionsProps) {
  const router = useRouter();
  const [rejectReason, setRejectReason] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const response = await fetch(`/api/admin/creators/${creatorId}/approve`, {
        method: "POST",
      });
      if (response.ok) {
        router.refresh();
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;

    setIsRejecting(true);
    try {
      const response = await fetch(`/api/admin/creators/${creatorId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (response.ok) {
        router.refresh();
      }
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="flex gap-2">
      {/* Bouton Approuver */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="default" className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Approuver
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approuver {brandName} ?</AlertDialogTitle>
            <AlertDialogDescription>
              En approuvant ce créateur, son compte sera activé et il pourra
              commencer à vendre sur la plateforme.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isApproving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isApproving ? "Approbation..." : "Approuver"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bouton Rejeter */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">
            <XCircle className="h-4 w-4 mr-2" />
            Rejeter
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter {brandName} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le créateur sera notifié par email avec le motif de rejet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label>Motif de rejet *</Label>
            <Textarea
              placeholder="Expliquez pourquoi cette demande est rejetée..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isRejecting || !rejectReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRejecting ? "Rejet..." : "Rejeter"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

### Template Email Approbation

```typescript
// src/lib/email/templates/creator-approved.tsx
import { EmailTemplate } from "../components";

interface CreatorApprovedEmailProps {
  name: string;
  brandName: string;
  dashboardUrl: string;
  guideUrl: string;
}

export function CreatorApprovedEmail({
  name,
  brandName,
  dashboardUrl,
  guideUrl,
}: CreatorApprovedEmailProps) {
  return (
    <EmailTemplate subject={`Bienvenue sur Tyler ! Votre compte ${brandName} est activé`}>
      <h1>Félicitations {name} !</h1>

      <p>
        Nous avons le plaisir de vous informer que votre compte créateur
        <strong> {brandName}</strong> a été vérifié et activé.
      </p>

      <div className="highlight">
        <h2>Prochaines étapes</h2>
        <ol>
          <li>Configurez votre boutique et personnalisez votre page</li>
          <li>Ajoutez vos premiers produits</li>
          <li>Partagez votre boutique avec votre communauté</li>
        </ol>
      </div>

      <div className="buttons">
        <a href={dashboardUrl} className="button primary">
          Accéder à mon dashboard
        </a>
        <a href={guideUrl} className="button secondary">
          Consulter le guide du créateur
        </a>
      </div>

      <p>
        Notre équipe est disponible pour vous accompagner. N'hésitez pas à
        nous contacter si vous avez des questions.
      </p>

      <p className="footer">
        Bonne vente !<br />
        L'équipe Tyler
      </p>
    </EmailTemplate>
  );
}
```

### Références

- [Source: architecture.md#Admin Module]
- [Source: prd.md#FR13]
- [Source: epics.md#Epic 11 - Administration]
- [Story: 11.2 - Liste créateurs]
- [Story: 11.3 - Désactivation compte]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
