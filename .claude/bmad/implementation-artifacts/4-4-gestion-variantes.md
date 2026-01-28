# Story 4.4: Gestion des Variantes Produit

Status: ready-for-dev

## Story

As a Créateur,
I want définir des variantes pour mes produits,
so that mes clients puissent choisir taille, couleur, etc.

## Acceptance Criteria

1. **AC1 - Ajout de variante**
   - **Given** un Créateur sur la page d'édition de produit
   - **When** il clique sur "Ajouter une variante"
   - **Then** il peut saisir : type (Taille/Couleur/etc), valeur, prix optionnel, stock

2. **AC2 - Liste des variantes**
   - **Given** des variantes ajoutées
   - **When** le Créateur consulte le produit
   - **Then** toutes les variantes sont listées avec leurs caractéristiques

3. **AC3 - Modification de variante**
   - **Given** une variante existante
   - **When** le Créateur modifie ses valeurs
   - **Then** les modifications sont enregistrées

4. **AC4 - Suppression de variante**
   - **Given** une variante existante
   - **When** le Créateur la supprime
   - **Then** la variante est supprimée du produit

## Tasks / Subtasks

- [ ] **Task 1: Créer l'entity ProductVariant** (AC: #1)
  - [ ] 1.1 Créer `src/modules/products/domain/entities/product-variant.entity.ts`
  - [ ] 1.2 Créer `VariantType` value object
  - [ ] 1.3 Définir les types standards (Taille, Couleur, Matière, etc.)

- [ ] **Task 2: Créer le composant VariantEditor** (AC: #1, #2, #3, #4)
  - [ ] 2.1 Créer `src/components/products/variant-editor.tsx`
  - [ ] 2.2 Implémenter le formulaire d'ajout
  - [ ] 2.3 Afficher la liste des variantes
  - [ ] 2.4 Gérer l'édition inline
  - [ ] 2.5 Gérer la suppression

- [ ] **Task 3: Implémenter les use cases** (AC: #1, #3, #4)
  - [ ] 3.1 Créer `AddVariantUseCase`
  - [ ] 3.2 Créer `UpdateVariantUseCase`
  - [ ] 3.3 Créer `RemoveVariantUseCase`

- [ ] **Task 4: Créer les Server Actions** (AC: #1, #3, #4)
  - [ ] 4.1 Créer les actions pour CRUD variantes
  - [ ] 4.2 Valider les données
  - [ ] 4.3 Revalider la page après modification

- [ ] **Task 5: Écrire les tests** (AC: #1-4)
  - [ ] 5.1 Tests unitaires pour ProductVariant entity
  - [ ] 5.2 Tests unitaires pour les use cases
  - [ ] 5.3 Tests d'intégration

## Dev Notes

### Entity ProductVariant

```typescript
// src/modules/products/domain/entities/product-variant.entity.ts
import { Entity, UniqueId, Result } from "@/shared/domain";
import { VariantType } from "../value-objects/variant-type.vo";
import { Money } from "../value-objects/money.vo";

interface ProductVariantProps {
  productId: string;
  type: VariantType;
  value: string;
  priceOverride?: Money;  // Si null, utilise le prix du produit
  stock: number;
  sku?: string;
}

export class ProductVariant extends Entity<ProductVariantProps> {
  private constructor(props: ProductVariantProps, id?: UniqueId) {
    super(props, id);
  }

  get productId(): string { return this.props.productId; }
  get type(): VariantType { return this.props.type; }
  get value(): string { return this.props.value; }
  get priceOverride(): Money | undefined { return this.props.priceOverride; }
  get stock(): number { return this.props.stock; }
  get sku(): string | undefined { return this.props.sku; }

  get isInStock(): boolean { return this.stock > 0; }

  static create(props: ProductVariantProps, id?: UniqueId): Result<ProductVariant> {
    if (!props.value.trim()) {
      return Result.fail("La valeur de la variante est requise");
    }

    if (props.stock < 0) {
      return Result.fail("Le stock ne peut pas être négatif");
    }

    return Result.ok(new ProductVariant(props, id));
  }

  updateStock(quantity: number): Result<void> {
    if (quantity < 0) {
      return Result.fail("Le stock ne peut pas être négatif");
    }
    this.props.stock = quantity;
    return Result.ok();
  }

  decrementStock(quantity: number = 1): Result<void> {
    if (this.stock < quantity) {
      return Result.fail("Stock insuffisant");
    }
    this.props.stock -= quantity;
    return Result.ok();
  }
}
```

### Value Object VariantType

```typescript
// src/modules/products/domain/value-objects/variant-type.vo.ts
import { ValueObject, Result } from "@/shared/domain";

type VariantTypeValue = "SIZE" | "COLOR" | "MATERIAL" | "STYLE" | "CUSTOM";

interface VariantTypeProps {
  value: VariantTypeValue;
  customLabel?: string;  // Pour les types CUSTOM
}

export class VariantType extends ValueObject<VariantTypeProps> {
  private static readonly LABELS: Record<VariantTypeValue, string> = {
    SIZE: "Taille",
    COLOR: "Couleur",
    MATERIAL: "Matière",
    STYLE: "Style",
    CUSTOM: "Personnalisé",
  };

  private constructor(props: VariantTypeProps) {
    super(props);
  }

  get value(): VariantTypeValue { return this.props.value; }
  get label(): string {
    if (this.props.value === "CUSTOM" && this.props.customLabel) {
      return this.props.customLabel;
    }
    return VariantType.LABELS[this.props.value];
  }

  static size(): VariantType { return new VariantType({ value: "SIZE" }); }
  static color(): VariantType { return new VariantType({ value: "COLOR" }); }
  static material(): VariantType { return new VariantType({ value: "MATERIAL" }); }
  static style(): VariantType { return new VariantType({ value: "STYLE" }); }

  static custom(label: string): Result<VariantType> {
    if (!label.trim()) {
      return Result.fail("Le libellé est requis pour un type personnalisé");
    }
    return Result.ok(new VariantType({ value: "CUSTOM", customLabel: label }));
  }

  static fromString(value: string, customLabel?: string): Result<VariantType> {
    if (!["SIZE", "COLOR", "MATERIAL", "STYLE", "CUSTOM"].includes(value)) {
      return Result.fail("Type de variante invalide");
    }
    if (value === "CUSTOM" && !customLabel) {
      return Result.fail("Le libellé est requis pour un type personnalisé");
    }
    return Result.ok(new VariantType({ value: value as VariantTypeValue, customLabel }));
  }
}
```

### Composant VariantEditor

```typescript
// src/components/products/variant-editor.tsx
"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Variant {
  id?: string;
  type: string;
  customLabel?: string;
  value: string;
  priceOverride?: number;
  stock: number;
}

interface VariantEditorProps {
  variants: Variant[];
  onAdd: (variant: Omit<Variant, "id">) => Promise<void>;
  onUpdate: (id: string, variant: Partial<Variant>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

const VARIANT_TYPES = [
  { value: "SIZE", label: "Taille" },
  { value: "COLOR", label: "Couleur" },
  { value: "MATERIAL", label: "Matière" },
  { value: "STYLE", label: "Style" },
  { value: "CUSTOM", label: "Personnalisé" },
];

export function VariantEditor({ variants, onAdd, onUpdate, onRemove }: VariantEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newVariant, setNewVariant] = useState<Omit<Variant, "id">>({
    type: "SIZE",
    value: "",
    stock: 0,
  });

  const handleAdd = async () => {
    await onAdd(newVariant);
    setNewVariant({ type: "SIZE", value: "", stock: 0 });
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Variantes</h3>
        <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-2" /> Ajouter
        </Button>
      </div>

      {variants.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Valeur</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant) => (
              <TableRow key={variant.id}>
                <TableCell>{variant.customLabel || VARIANT_TYPES.find(t => t.value === variant.type)?.label}</TableCell>
                <TableCell>{variant.value}</TableCell>
                <TableCell>{variant.priceOverride ? `${variant.priceOverride}€` : "-"}</TableCell>
                <TableCell>{variant.stock}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => onRemove(variant.id!)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {isAdding && (
        <div className="grid grid-cols-5 gap-4 p-4 border rounded-lg">
          <Select value={newVariant.type} onValueChange={(v) => setNewVariant(nv => ({ ...nv, type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {VARIANT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Valeur (ex: M, Rouge)" value={newVariant.value} onChange={e => setNewVariant(nv => ({ ...nv, value: e.target.value }))} />
          <Input type="number" placeholder="Prix (optionnel)" value={newVariant.priceOverride || ""} onChange={e => setNewVariant(nv => ({ ...nv, priceOverride: e.target.value ? parseFloat(e.target.value) : undefined }))} />
          <Input type="number" placeholder="Stock" value={newVariant.stock} onChange={e => setNewVariant(nv => ({ ...nv, stock: parseInt(e.target.value) || 0 }))} />
          <div className="flex gap-2">
            <Button onClick={handleAdd}>Ajouter</Button>
            <Button variant="outline" onClick={() => setIsAdding(false)}>Annuler</Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Schéma Prisma ProductVariant

```prisma
model ProductVariant {
  id            String   @id @default(cuid())
  productId     String
  product       Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  type          String   // SIZE, COLOR, MATERIAL, STYLE, CUSTOM
  customLabel   String?  // Pour les types CUSTOM
  value         String
  priceOverride Int?     // En centimes, null = utilise prix produit
  stock         Int      @default(0)
  sku           String?

  orderItems    OrderItem[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([productId])
  @@map("product_variants")
}
```

### Références

- [Source: architecture.md#Product Variants]
- [Source: prd.md#FR18]
- [Source: epics.md#Story 4.4]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
