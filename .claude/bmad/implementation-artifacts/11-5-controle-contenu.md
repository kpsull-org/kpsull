# Story 11.5: Controle Contenu et Moderation

Status: ready-for-dev

## Story

As a Admin,
I want modérer le contenu de la plateforme,
so that je puisse maintenir la qualité et la conformité des produits vendus.

## Acceptance Criteria

1. **AC1 - Liste des produits signalés**
   - **Given** un Admin sur la page de modération
   - **When** il consulte la liste
   - **Then** il voit tous les produits signalés avec : titre, créateur, nombre de signalements, motifs, date du premier signalement

2. **AC2 - Actions de modération**
   - **Given** un Admin sur un produit signalé
   - **When** il examine le produit
   - **Then** il peut : Approuver (clôturer les signalements), Masquer (produit invisible), Supprimer (retrait définitif)

3. **AC3 - Historique des actions de modération**
   - **Given** un Admin sur la page de modération
   - **When** il consulte l'historique
   - **Then** il voit toutes les actions passées avec : produit, action, admin, date, motif

4. **AC4 - Notification au créateur**
   - **Given** un Admin qui modère un produit
   - **When** il masque ou supprime
   - **Then** le créateur reçoit un email avec le motif et les recours possibles

5. **AC5 - Signalement par les utilisateurs**
   - **Given** un utilisateur sur une page produit
   - **When** il clique sur "Signaler"
   - **Then** il peut sélectionner un motif et ajouter un commentaire

## Tasks / Subtasks

- [ ] **Task 1: Créer le système de signalement** (AC: #5)
  - [ ] 1.1 Créer le modèle `ProductReport` dans Prisma
  - [ ] 1.2 Créer `ReportProductUseCase`
  - [ ] 1.3 Créer le composant `ReportProductButton` et modal
  - [ ] 1.4 Implémenter l'API `POST /api/products/:id/report`

- [ ] **Task 2: Créer la page de modération admin** (AC: #1)
  - [ ] 2.1 Créer `src/app/(admin)/admin/moderation/page.tsx`
  - [ ] 2.2 Implémenter la DataTable des produits signalés
  - [ ] 2.3 Ajouter les filtres par motif et statut
  - [ ] 2.4 Afficher le nombre de signalements agrégé

- [ ] **Task 3: Implémenter les actions de modération** (AC: #2)
  - [ ] 3.1 Créer `ApproveProductUseCase` (clôturer signalements)
  - [ ] 3.2 Créer `HideProductUseCase` (masquer produit)
  - [ ] 3.3 Créer `DeleteProductUseCase` (suppression définitive)
  - [ ] 3.4 Créer les routes API correspondantes

- [ ] **Task 4: Implémenter l'historique de modération** (AC: #3)
  - [ ] 4.1 Créer le modèle `ModerationLog` ou utiliser `AuditLog`
  - [ ] 4.2 Créer la vue historique avec filtres
  - [ ] 4.3 Permettre l'export de l'historique

- [ ] **Task 5: Implémenter les notifications** (AC: #4)
  - [ ] 5.1 Créer template `product-hidden`
  - [ ] 5.2 Créer template `product-deleted`

- [ ] **Task 6: Écrire les tests** (AC: #1-5)
  - [ ] 6.1 Tests unitaires pour les use cases
  - [ ] 6.2 Tests d'intégration pour les API
  - [ ] 6.3 Tests du flux de signalement complet

## Dev Notes

### Modèle ProductReport

```prisma
// prisma/schema.prisma
model ProductReport {
  id          String   @id @default(cuid())
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  reporterId  String?  // null si signalement anonyme
  reporter    User?    @relation(fields: [reporterId], references: [id])
  reason      ReportReason
  comment     String?
  status      ReportStatus @default(PENDING)
  createdAt   DateTime @default(now())
  resolvedAt  DateTime?
  resolvedBy  String?
  resolution  String?

  @@index([productId])
  @@index([status])
  @@map("product_reports")
}

enum ReportReason {
  COUNTERFEIT        // Contrefaçon
  INAPPROPRIATE      // Contenu inapproprié
  MISLEADING         // Description trompeuse
  PROHIBITED_ITEM    // Article interdit
  COPYRIGHT          // Violation copyright
  OTHER              // Autre
}

enum ReportStatus {
  PENDING
  REVIEWED
  RESOLVED
  DISMISSED
}
```

### Page Modération Admin

```typescript
// src/app/(admin)/admin/moderation/page.tsx
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportedProductsTable } from "./components/ReportedProductsTable";
import { ModerationHistoryTable } from "./components/ModerationHistoryTable";
import { getModerationStats } from "@/modules/admin/application/services/moderation.service";

export default async function ModerationPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  const stats = await getModerationStats();

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Modération du contenu</h1>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="En attente"
          value={stats.pendingReports}
          variant="warning"
        />
        <StatCard
          title="Traités aujourd'hui"
          value={stats.resolvedToday}
          variant="success"
        />
        <StatCard
          title="Produits masqués"
          value={stats.hiddenProducts}
          variant="secondary"
        />
        <StatCard
          title="Supprimés ce mois"
          value={stats.deletedThisMonth}
          variant="destructive"
        />
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            En attente ({stats.pendingReports})
          </TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <ReportedProductsTable />
        </TabsContent>
        <TabsContent value="history">
          <ModerationHistoryTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Table Produits Signalés

```typescript
// src/app/(admin)/admin/moderation/components/ReportedProductsTable.tsx
"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, EyeOff, Trash2, Check } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { ModerationModal } from "./ModerationModal";

interface ReportedProduct {
  id: string;
  title: string;
  creator: {
    brandName: string;
  };
  reportCount: number;
  reasons: string[];
  firstReportedAt: Date;
  imageUrl: string;
}

const reasonLabels: Record<string, string> = {
  COUNTERFEIT: "Contrefaçon",
  INAPPROPRIATE: "Inapproprié",
  MISLEADING: "Trompeur",
  PROHIBITED_ITEM: "Interdit",
  COPYRIGHT: "Copyright",
  OTHER: "Autre",
};

export function ReportedProductsTable({ data }: { data: ReportedProduct[] }) {
  const [selectedProduct, setSelectedProduct] = useState<ReportedProduct | null>(null);
  const [modalAction, setModalAction] = useState<"approve" | "hide" | "delete" | null>(null);

  const columns: ColumnDef<ReportedProduct>[] = [
    {
      accessorKey: "imageUrl",
      header: "",
      cell: ({ row }) => (
        <img
          src={row.original.imageUrl}
          alt={row.original.title}
          className="w-12 h-12 object-cover rounded"
        />
      ),
    },
    {
      accessorKey: "title",
      header: "Produit",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.title}</div>
          <div className="text-sm text-muted-foreground">
            par {row.original.creator.brandName}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "reportCount",
      header: "Signalements",
      cell: ({ row }) => (
        <Badge variant={row.original.reportCount >= 5 ? "destructive" : "warning"}>
          {row.original.reportCount}
        </Badge>
      ),
    },
    {
      accessorKey: "reasons",
      header: "Motifs",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.reasons.slice(0, 2).map((reason) => (
            <Badge key={reason} variant="outline" className="text-xs">
              {reasonLabels[reason]}
            </Badge>
          ))}
          {row.original.reasons.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{row.original.reasons.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "firstReportedAt",
      header: "Signalé le",
      cell: ({ row }) => formatDate(row.original.firstReportedAt),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setSelectedProduct(row.original);
                setModalAction("approve");
              }}
            >
              <Check className="h-4 w-4 mr-2" />
              Approuver (clôturer)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedProduct(row.original);
                setModalAction("hide");
              }}
            >
              <EyeOff className="h-4 w-4 mr-2" />
              Masquer
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                setSelectedProduct(row.original);
                setModalAction("delete");
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={data} />
      {selectedProduct && modalAction && (
        <ModerationModal
          product={selectedProduct}
          action={modalAction}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedProduct(null);
              setModalAction(null);
            }
          }}
        />
      )}
    </>
  );
}
```

### Use Case HideProduct

```typescript
// src/modules/admin/application/use-cases/hide-product.use-case.ts
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { Result } from "@/lib/result";

interface HideProductDTO {
  productId: string;
  adminId: string;
  reason: string;
}

export async function hideProduct(dto: HideProductDTO): Promise<Result<void>> {
  const { productId, adminId, reason } = dto;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      creator: {
        include: {
          user: { select: { email: true, name: true } },
        },
      },
    },
  });

  if (!product) {
    return Result.fail("Produit non trouvé");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Masquer le produit
    await tx.product.update({
      where: { id: productId },
      data: {
        status: "HIDDEN",
        previousStatus: product.status,
      },
    });

    // 2. Résoudre tous les signalements
    await tx.productReport.updateMany({
      where: {
        productId,
        status: "PENDING",
      },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolvedBy: adminId,
        resolution: "PRODUCT_HIDDEN",
      },
    });

    // 3. Créer le log d'audit
    await tx.auditLog.create({
      data: {
        action: "PRODUCT_HIDDEN",
        entityType: "Product",
        entityId: productId,
        adminId,
        changes: {
          previousStatus: product.status,
          newStatus: "HIDDEN",
        },
        reason,
      },
    });
  });

  // 4. Notifier le créateur
  await sendEmail({
    to: product.creator.user.email,
    template: "product-hidden",
    data: {
      name: product.creator.user.name,
      productTitle: product.title,
      reason,
      appealUrl: `${process.env.APP_URL}/creator/products/${productId}/appeal`,
    },
  });

  return Result.ok();
}
```

### Bouton Signalement Utilisateur

```typescript
// src/components/products/ReportProductButton.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const reportReasons = [
  { value: "COUNTERFEIT", label: "Produit contrefait" },
  { value: "INAPPROPRIATE", label: "Contenu inapproprié" },
  { value: "MISLEADING", label: "Description trompeuse" },
  { value: "PROHIBITED_ITEM", label: "Article interdit à la vente" },
  { value: "COPYRIGHT", label: "Violation de copyright" },
  { value: "OTHER", label: "Autre raison" },
];

interface ReportProductButtonProps {
  productId: string;
}

export function ReportProductButton({ productId }: ReportProductButtonProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/products/${productId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, comment }),
      });

      if (response.ok) {
        toast({
          title: "Signalement envoyé",
          description: "Merci pour votre signalement. Notre équipe va l'examiner.",
        });
        setOpen(false);
        setReason("");
        setComment("");
      } else {
        throw new Error("Erreur lors du signalement");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le signalement. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Flag className="h-4 w-4 mr-2" />
          Signaler
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Signaler ce produit</DialogTitle>
          <DialogDescription>
            Aidez-nous à maintenir la qualité de la plateforme en signalant les
            produits problématiques.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Raison du signalement *</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {reportReasons.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Commentaire (optionnel)</Label>
            <Textarea
              placeholder="Donnez plus de détails sur le problème..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
          >
            {isSubmitting ? "Envoi..." : "Envoyer le signalement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Historique de Modération

```typescript
// src/app/(admin)/admin/moderation/components/ModerationHistoryTable.tsx
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/format";

interface ModerationLogEntry {
  id: string;
  action: "PRODUCT_APPROVED" | "PRODUCT_HIDDEN" | "PRODUCT_DELETED";
  product: {
    title: string;
    creator: { brandName: string };
  };
  admin: { name: string };
  reason: string;
  createdAt: Date;
}

const actionConfig = {
  PRODUCT_APPROVED: { label: "Approuvé", variant: "success" },
  PRODUCT_HIDDEN: { label: "Masqué", variant: "warning" },
  PRODUCT_DELETED: { label: "Supprimé", variant: "destructive" },
};

export async function ModerationHistoryTable() {
  const logs = await getModerationHistory();

  const columns: ColumnDef<ModerationLogEntry>[] = [
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.createdAt, "PPpp"),
    },
    {
      accessorKey: "product.title",
      header: "Produit",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.product.title}</div>
          <div className="text-sm text-muted-foreground">
            par {row.original.product.creator.brandName}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const config = actionConfig[row.original.action];
        return <Badge variant={config.variant as any}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: "admin.name",
      header: "Modérateur",
    },
    {
      accessorKey: "reason",
      header: "Motif",
      cell: ({ row }) => (
        <span className="text-sm max-w-xs truncate">
          {row.original.reason}
        </span>
      ),
    },
  ];

  return <DataTable columns={columns} data={logs} />;
}
```

### Références

- [Source: architecture.md#Admin Module]
- [Source: prd.md#FR14]
- [Source: epics.md#Epic 11 - Administration]
- [Story: 11.2 - Liste créateurs]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
