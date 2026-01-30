# Story 8.4: Selection du Transporteur

Status: ready-for-dev

## Story

As a Createur,
I want selectionner un transporteur parmi une liste predefininie,
so that le client recoive un lien de suivi fonctionnel.

## Acceptance Criteria

1. **AC1 - Liste des transporteurs**
   - **Given** le formulaire d'expedition
   - **When** le Createur ouvre la liste des transporteurs
   - **Then** il voit: Colissimo, Mondial Relay, Chronopost, UPS, DHL, Autre

2. **AC2 - Validation format numero selon transporteur**
   - **Given** un transporteur selectionne
   - **When** le Createur saisit un numero de suivi
   - **Then** le format est valide selon les regles du transporteur
   - **And** un message d'aide affiche le format attendu

3. **AC3 - Generation URL de suivi**
   - **Given** un transporteur et un numero valides
   - **When** l'expedition est confirmee
   - **Then** l'URL de suivi est generee automatiquement

4. **AC4 - Transporteur "Autre"**
   - **Given** le transporteur "Autre" selectionne
   - **When** le Createur saisit les infos
   - **Then** aucune validation de format n'est appliquee
   - **And** aucune URL de suivi n'est generee

## Tasks / Subtasks

- [ ] **Task 1: Definir les patterns de validation** (AC: #2)
  - [ ] 1.1 Documenter les formats pour chaque transporteur
  - [ ] 1.2 Creer les regex de validation
  - [ ] 1.3 Creer les messages d'aide

- [ ] **Task 2: Creer le composant CarrierSelect** (AC: #1)
  - [ ] 2.1 Creer `src/components/orders/carrier-select.tsx`
  - [ ] 2.2 Afficher la liste des transporteurs avec logos
  - [ ] 2.3 Gerer la selection

- [ ] **Task 3: Creer le composant TrackingNumberInput** (AC: #2, #4)
  - [ ] 3.1 Creer `src/components/orders/tracking-number-input.tsx`
  - [ ] 3.2 Valider en temps reel selon le transporteur
  - [ ] 3.3 Afficher le message d'aide contextuel
  - [ ] 3.4 Gerer le cas "Autre"

- [ ] **Task 4: Etendre le TrackingUrlService** (AC: #3)
  - [ ] 4.1 Ajouter les templates URL pour chaque transporteur
  - [ ] 4.2 Implementer la generation d'URL
  - [ ] 4.3 Gerer le cas "Autre" (pas d'URL)

- [ ] **Task 5: Creer le schema Zod avec validation dynamique** (AC: #2)
  - [ ] 5.1 Creer le schema de validation
  - [ ] 5.2 Implementer la validation conditionnelle
  - [ ] 5.3 Tester tous les cas

- [ ] **Task 6: Ecrire les tests** (AC: #1-4)
  - [ ] 6.1 Tests unitaires pour la validation
  - [ ] 6.2 Tests unitaires pour la generation URL
  - [ ] 6.3 Tests de composants

## Dev Notes

### Configuration des Transporteurs

```typescript
// src/modules/orders/domain/config/carriers.config.ts
import { Carrier } from "../value-objects/carrier.vo";

export interface CarrierConfig {
  value: Carrier;
  label: string;
  logo?: string;
  trackingNumberPattern: RegExp;
  trackingNumberFormat: string;
  trackingNumberExample: string;
  trackingUrlTemplate: string | null;
}

export const CARRIERS_CONFIG: Record<Carrier, CarrierConfig> = {
  COLISSIMO: {
    value: "COLISSIMO",
    label: "Colissimo",
    logo: "/carriers/colissimo.svg",
    trackingNumberPattern: /^[A-Z0-9]{11,15}$/i,
    trackingNumberFormat: "11 a 15 caracteres alphanumeriques",
    trackingNumberExample: "6C12345678901",
    trackingUrlTemplate: "https://www.laposte.fr/outils/suivre-vos-envois?code={tracking}",
  },
  MONDIAL_RELAY: {
    value: "MONDIAL_RELAY",
    label: "Mondial Relay",
    logo: "/carriers/mondial-relay.svg",
    trackingNumberPattern: /^[0-9]{8,12}$/,
    trackingNumberFormat: "8 a 12 chiffres",
    trackingNumberExample: "12345678",
    trackingUrlTemplate: "https://www.mondialrelay.fr/suivi-de-colis/?numeroExpedition={tracking}",
  },
  CHRONOPOST: {
    value: "CHRONOPOST",
    label: "Chronopost",
    logo: "/carriers/chronopost.svg",
    trackingNumberPattern: /^[A-Z]{2}[0-9]{9}[A-Z]{2}$/i,
    trackingNumberFormat: "2 lettres + 9 chiffres + 2 lettres",
    trackingNumberExample: "XY123456789FR",
    trackingUrlTemplate: "https://www.chronopost.fr/tracking-no-cms/suivi-page?liession={tracking}",
  },
  UPS: {
    value: "UPS",
    label: "UPS",
    logo: "/carriers/ups.svg",
    trackingNumberPattern: /^1Z[A-Z0-9]{16}$/i,
    trackingNumberFormat: "1Z suivi de 16 caracteres",
    trackingNumberExample: "1Z999AA10123456784",
    trackingUrlTemplate: "https://www.ups.com/track?tracknum={tracking}",
  },
  DHL: {
    value: "DHL",
    label: "DHL",
    logo: "/carriers/dhl.svg",
    trackingNumberPattern: /^[0-9]{10,22}$/,
    trackingNumberFormat: "10 a 22 chiffres",
    trackingNumberExample: "1234567890",
    trackingUrlTemplate: "https://www.dhl.com/fr-fr/home/tracking.html?tracking-id={tracking}",
  },
  OTHER: {
    value: "OTHER",
    label: "Autre transporteur",
    logo: undefined,
    trackingNumberPattern: /^.+$/,  // Accepte tout
    trackingNumberFormat: "Format libre",
    trackingNumberExample: "",
    trackingUrlTemplate: null,  // Pas de generation d'URL
  },
};

export function getCarrierConfig(carrier: Carrier): CarrierConfig {
  return CARRIERS_CONFIG[carrier];
}

export function getAllCarriers(): CarrierConfig[] {
  return Object.values(CARRIERS_CONFIG);
}
```

### Schema de Validation Zod

```typescript
// src/modules/orders/application/schemas/ship-order.schema.ts
import { z } from "zod";
import { CARRIERS_CONFIG, CarrierConfig } from "../../domain/config/carriers.config";
import { Carrier, CARRIERS } from "../../domain/value-objects/carrier.vo";

export const shipOrderSchema = z.object({
  carrier: z.enum(CARRIERS as [Carrier, ...Carrier[]]),
  trackingNumber: z.string().min(1, "Le numero de suivi est requis"),
}).refine(
  (data) => {
    const config = CARRIERS_CONFIG[data.carrier];
    return config.trackingNumberPattern.test(data.trackingNumber);
  },
  (data) => {
    const config = CARRIERS_CONFIG[data.carrier];
    return {
      message: `Format invalide. Attendu: ${config.trackingNumberFormat}`,
      path: ["trackingNumber"],
    };
  }
);

export type ShipOrderFormData = z.infer<typeof shipOrderSchema>;

// Validation cote client (sans refine pour validation temps reel)
export function validateTrackingNumber(carrier: Carrier, trackingNumber: string): {
  isValid: boolean;
  message: string;
} {
  const config = CARRIERS_CONFIG[carrier];
  const isValid = config.trackingNumberPattern.test(trackingNumber);

  if (isValid) {
    return { isValid: true, message: "Format valide" };
  }

  return {
    isValid: false,
    message: `Format attendu: ${config.trackingNumberFormat}`,
  };
}
```

### Composant CarrierSelect

```typescript
// src/components/orders/carrier-select.tsx
"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { getAllCarriers, CarrierConfig } from "@/modules/orders/domain/config/carriers.config";
import { Carrier } from "@/modules/orders/domain/value-objects/carrier.vo";

interface CarrierSelectProps {
  value: Carrier;
  onChange: (carrier: Carrier) => void;
  error?: string;
}

export function CarrierSelect({ value, onChange, error }: CarrierSelectProps) {
  const carriers = getAllCarriers();

  return (
    <div className="space-y-2">
      <Label>Transporteur</Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {carriers.map((carrier) => (
          <CarrierOption
            key={carrier.value}
            carrier={carrier}
            isSelected={value === carrier.value}
            onSelect={() => onChange(carrier.value)}
          />
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

interface CarrierOptionProps {
  carrier: CarrierConfig;
  isSelected: boolean;
  onSelect: () => void;
}

function CarrierOption({ carrier, isSelected, onSelect }: CarrierOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex flex-col items-center justify-center p-4 border rounded-lg transition-colors",
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary"
          : "border-border hover:border-primary/50"
      )}
    >
      {isSelected && (
        <div className="absolute top-2 right-2">
          <Check className="h-4 w-4 text-primary" />
        </div>
      )}

      <div className="h-10 w-20 relative flex items-center justify-center">
        {carrier.logo ? (
          <Image
            src={carrier.logo}
            alt={carrier.label}
            width={80}
            height={40}
            className="object-contain"
          />
        ) : (
          <span className="text-2xl text-muted-foreground">?</span>
        )}
      </div>

      <span className="mt-2 text-sm font-medium">{carrier.label}</span>
    </button>
  );
}
```

### Composant TrackingNumberInput

```typescript
// src/components/orders/tracking-number-input.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, X, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCarrierConfig } from "@/modules/orders/domain/config/carriers.config";
import { validateTrackingNumber } from "@/modules/orders/application/schemas/ship-order.schema";
import { Carrier } from "@/modules/orders/domain/value-objects/carrier.vo";
import { cn } from "@/lib/utils";

interface TrackingNumberInputProps {
  carrier: Carrier;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function TrackingNumberInput({
  carrier,
  value,
  onChange,
  error,
}: TrackingNumberInputProps) {
  const [validation, setValidation] = useState<{ isValid: boolean; message: string } | null>(null);
  const config = getCarrierConfig(carrier);

  // Debounced validation
  useEffect(() => {
    if (!value) {
      setValidation(null);
      return;
    }

    const timer = setTimeout(() => {
      setValidation(validateTrackingNumber(carrier, value));
    }, 300);

    return () => clearTimeout(timer);
  }, [carrier, value]);

  return (
    <div className="space-y-2">
      <Label htmlFor="trackingNumber">Numero de suivi</Label>

      <div className="relative">
        <Input
          id="trackingNumber"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder={config.trackingNumberExample || "Entrez le numero de suivi"}
          className={cn(
            "pr-10",
            validation?.isValid === false && "border-destructive",
            validation?.isValid === true && "border-green-500"
          )}
        />

        {validation && value && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {validation.isValid ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-destructive" />
            )}
          </div>
        )}
      </div>

      {/* Help message */}
      <div className={cn(
        "flex items-start gap-2 text-sm",
        validation?.isValid === false ? "text-destructive" : "text-muted-foreground"
      )}>
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          {validation?.isValid === false
            ? validation.message
            : `Format: ${config.trackingNumberFormat}`}
        </span>
      </div>

      {error && !validation && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
```

### Service TrackingUrl Etendu

```typescript
// src/modules/orders/domain/services/tracking-url.service.ts
import { injectable } from "tsyringe";
import { Carrier } from "../value-objects/carrier.vo";
import { CARRIERS_CONFIG, getCarrierConfig } from "../config/carriers.config";

@injectable()
export class TrackingUrlService {
  /**
   * Generate tracking URL for a carrier and tracking number
   * Returns null if the carrier doesn't support tracking URLs
   */
  generateUrl(carrier: Carrier, trackingNumber: string): string | null {
    const config = getCarrierConfig(carrier);

    if (!config.trackingUrlTemplate) {
      return null;
    }

    return config.trackingUrlTemplate.replace("{tracking}", trackingNumber);
  }

  /**
   * Validate tracking number format for a carrier
   */
  validateTrackingNumber(carrier: Carrier, trackingNumber: string): boolean {
    const config = getCarrierConfig(carrier);
    return config.trackingNumberPattern.test(trackingNumber);
  }

  /**
   * Get carrier display name
   */
  getCarrierName(carrier: Carrier): string {
    return getCarrierConfig(carrier).label;
  }

  /**
   * Check if carrier supports tracking URL generation
   */
  supportsTracking(carrier: Carrier): boolean {
    return getCarrierConfig(carrier).trackingUrlTemplate !== null;
  }
}
```

### Formulaire Integre avec Validation

```typescript
// src/components/orders/ship-order-form.tsx (version mise a jour)
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Package, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CarrierSelect } from "./carrier-select";
import { TrackingNumberInput } from "./tracking-number-input";
import { shipOrderSchema, ShipOrderFormData } from "@/modules/orders/application/schemas/ship-order.schema";
import { getCarrierConfig } from "@/modules/orders/domain/config/carriers.config";
import { shipOrder } from "./actions";

interface ShipOrderFormProps {
  orderId: string;
  orderNumber: string;
}

export function ShipOrderForm({ orderId, orderNumber }: ShipOrderFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ShipOrderFormData>({
    resolver: zodResolver(shipOrderSchema),
    defaultValues: {
      carrier: "COLISSIMO",
      trackingNumber: "",
    },
  });

  const selectedCarrier = watch("carrier");
  const carrierConfig = getCarrierConfig(selectedCarrier);

  const onSubmit = async (data: ShipOrderFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await shipOrder(orderId, data);

      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/dashboard/orders/${orderId}`);
        router.refresh();
      }
    } catch (err) {
      setError("Une erreur est survenue lors de l'expedition");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Informations d'expedition
        </CardTitle>
        <CardDescription>
          Renseignez les informations de suivi pour la commande {orderNumber}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Controller
            name="carrier"
            control={control}
            render={({ field }) => (
              <CarrierSelect
                value={field.value}
                onChange={field.onChange}
                error={errors.carrier?.message}
              />
            )}
          />

          <Controller
            name="trackingNumber"
            control={control}
            render={({ field }) => (
              <TrackingNumberInput
                carrier={selectedCarrier}
                value={field.value}
                onChange={field.onChange}
                error={errors.trackingNumber?.message}
              />
            )}
          />

          {selectedCarrier === "OTHER" && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Avec "Autre transporteur", aucun lien de suivi ne sera genere
                automatiquement. Le client recevra uniquement le numero de suivi.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmer l'expedition
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Tests de Validation

```typescript
// src/modules/orders/application/schemas/__tests__/ship-order.schema.test.ts
import { describe, it, expect } from "vitest";
import { shipOrderSchema, validateTrackingNumber } from "../ship-order.schema";

describe("shipOrderSchema", () => {
  describe("Colissimo", () => {
    it("should accept valid Colissimo tracking number", () => {
      const result = shipOrderSchema.safeParse({
        carrier: "COLISSIMO",
        trackingNumber: "6C12345678901",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid Colissimo tracking number", () => {
      const result = shipOrderSchema.safeParse({
        carrier: "COLISSIMO",
        trackingNumber: "123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("UPS", () => {
    it("should accept valid UPS tracking number", () => {
      const result = shipOrderSchema.safeParse({
        carrier: "UPS",
        trackingNumber: "1Z999AA10123456784",
      });
      expect(result.success).toBe(true);
    });

    it("should reject UPS tracking without 1Z prefix", () => {
      const result = shipOrderSchema.safeParse({
        carrier: "UPS",
        trackingNumber: "2Z999AA10123456784",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("OTHER carrier", () => {
    it("should accept any tracking number format", () => {
      const result = shipOrderSchema.safeParse({
        carrier: "OTHER",
        trackingNumber: "any-format-123",
      });
      expect(result.success).toBe(true);
    });
  });
});

describe("validateTrackingNumber", () => {
  it("should return valid for correct format", () => {
    const result = validateTrackingNumber("UPS", "1Z999AA10123456784");
    expect(result.isValid).toBe(true);
  });

  it("should return invalid with helpful message", () => {
    const result = validateTrackingNumber("UPS", "invalid");
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("1Z suivi de 16 caracteres");
  });
});
```

### References

- [Source: architecture.md#Carrier Integration]
- [Source: prd.md#FR38 - Selection transporteur]
- [Source: epics.md#Story 8.4]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
