# Story 7.4: Saisie de l'Adresse de Livraison

Status: ready-for-dev

## Story

As a Client au checkout,
I want saisir mon adresse de livraison,
so that je puisse recevoir ma commande.

## Acceptance Criteria

1. **AC1 - Formulaire complet**
   - **Given** un Client a l'etape adresse du checkout
   - **When** il remplit le formulaire
   - **Then** il peut saisir : prenom, nom, adresse ligne 1, adresse ligne 2 (optionnel), code postal, ville, pays, telephone
   - **And** les champs obligatoires sont clairement indiques

2. **AC2 - Validation temps reel**
   - **Given** un Client qui remplit le formulaire
   - **When** il saisit des donnees
   - **Then** les champs sont valides en temps reel
   - **And** les erreurs sont affichees sous chaque champ concerne
   - **And** le format du code postal est valide selon le pays

3. **AC3 - Selection adresse existante**
   - **Given** un Client avec des adresses enregistrees
   - **When** il arrive au checkout
   - **Then** il peut selectionner une adresse existante
   - **And** les champs sont pre-remplis avec l'adresse selectionnee

4. **AC4 - Ajout nouvelle adresse**
   - **Given** un Client au checkout
   - **When** il choisit "Ajouter une nouvelle adresse"
   - **Then** un formulaire vide s'affiche
   - **And** il peut cocher "Sauvegarder cette adresse" pour future utilisation

5. **AC5 - Passage a l'etape paiement**
   - **Given** une adresse valide saisie
   - **When** le Client clique sur "Continuer vers le paiement"
   - **Then** une Address est creee (si nouvelle) ou selectionnee
   - **And** il passe a l'etape paiement

## Tasks / Subtasks

- [ ] **Task 1: Creer le schema de validation** (AC: #2)
  - [ ] 1.1 Creer `src/lib/validations/address.schema.ts` avec Zod
  - [ ] 1.2 Implementer les regles de validation par pays
  - [ ] 1.3 Valider le format telephone

- [ ] **Task 2: Creer le formulaire d'adresse** (AC: #1, #2)
  - [ ] 2.1 Creer `src/components/checkout/address-form.tsx`
  - [ ] 2.2 Integrer react-hook-form avec Zod resolver
  - [ ] 2.3 Ajouter la validation temps reel

- [ ] **Task 3: Creer le selecteur d'adresses** (AC: #3)
  - [ ] 3.1 Creer `src/components/checkout/address-selector.tsx`
  - [ ] 3.2 Afficher les adresses existantes en cartes
  - [ ] 3.3 Permettre la selection et le pre-remplissage

- [ ] **Task 4: Implementer la sauvegarde d'adresse** (AC: #4, #5)
  - [ ] 4.1 Creer `src/modules/addresses/application/use-cases/create-address.use-case.ts`
  - [ ] 4.2 Creer `src/app/api/addresses/route.ts`
  - [ ] 4.3 Gerer la checkbox "Sauvegarder cette adresse"

- [ ] **Task 5: Integrer dans le flow checkout** (AC: #5)
  - [ ] 5.1 Creer le composant CheckoutSteps
  - [ ] 5.2 Gerer la navigation entre etapes
  - [ ] 5.3 Stocker l'adresse selectionnee dans le state checkout

- [ ] **Task 6: Ecrire les tests** (AC: #1-5)
  - [ ] 6.1 Tests unitaires pour le schema de validation
  - [ ] 6.2 Tests pour le formulaire d'adresse
  - [ ] 6.3 Tests pour le selecteur d'adresses

## Dev Notes

### Schema de Validation Adresse

```typescript
// src/lib/validations/address.schema.ts
import { z } from "zod";

const POSTAL_CODE_PATTERNS: Record<string, RegExp> = {
  FR: /^[0-9]{5}$/,
  BE: /^[0-9]{4}$/,
  CH: /^[0-9]{4}$/,
  LU: /^[0-9]{4}$/,
  DE: /^[0-9]{5}$/,
  ES: /^[0-9]{5}$/,
  IT: /^[0-9]{5}$/,
  PT: /^[0-9]{4}-[0-9]{3}$/,
  GB: /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i,
};

const PHONE_PATTERN = /^(\+[0-9]{1,3})?[0-9]{9,14}$/;

export const addressSchema = z.object({
  firstName: z
    .string()
    .min(1, "Le prenom est requis")
    .max(50, "Le prenom est trop long"),

  lastName: z
    .string()
    .min(1, "Le nom est requis")
    .max(50, "Le nom est trop long"),

  company: z
    .string()
    .max(100, "Le nom d'entreprise est trop long")
    .optional(),

  address1: z
    .string()
    .min(1, "L'adresse est requise")
    .max(200, "L'adresse est trop longue"),

  address2: z
    .string()
    .max(200, "Le complement d'adresse est trop long")
    .optional(),

  city: z
    .string()
    .min(1, "La ville est requise")
    .max(100, "Le nom de ville est trop long"),

  state: z
    .string()
    .max(100, "Le nom de region est trop long")
    .optional(),

  postalCode: z
    .string()
    .min(1, "Le code postal est requis"),

  country: z
    .string()
    .min(2, "Le pays est requis")
    .max(2, "Code pays invalide")
    .default("FR"),

  phone: z
    .string()
    .min(1, "Le telephone est requis")
    .regex(PHONE_PATTERN, "Format de telephone invalide"),

  saveAddress: z.boolean().optional().default(false),
}).refine(
  (data) => {
    const pattern = POSTAL_CODE_PATTERNS[data.country];
    if (!pattern) return true;
    return pattern.test(data.postalCode);
  },
  {
    message: "Le format du code postal est invalide pour ce pays",
    path: ["postalCode"],
  }
);

export type AddressFormData = z.infer<typeof addressSchema>;

export const COUNTRIES = [
  { code: "FR", name: "France" },
  { code: "BE", name: "Belgique" },
  { code: "CH", name: "Suisse" },
  { code: "LU", name: "Luxembourg" },
  { code: "DE", name: "Allemagne" },
  { code: "ES", name: "Espagne" },
  { code: "IT", name: "Italie" },
  { code: "PT", name: "Portugal" },
  { code: "GB", name: "Royaume-Uni" },
] as const;
```

### Composant AddressForm

```typescript
// src/components/checkout/address-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addressSchema, AddressFormData, COUNTRIES } from "@/lib/validations/address.schema";

interface AddressFormProps {
  defaultValues?: Partial<AddressFormData>;
  onSubmit: (data: AddressFormData) => void;
  showSaveOption?: boolean;
}

export function AddressForm({
  defaultValues,
  onSubmit,
  showSaveOption = true,
}: AddressFormProps) {
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      company: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "FR",
      phone: "",
      saveAddress: false,
      ...defaultValues,
    },
    mode: "onChange",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prenom *</FormLabel>
                <FormControl>
                  <Input placeholder="Jean" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom *</FormLabel>
                <FormControl>
                  <Input placeholder="Dupont" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Entreprise (optionnel)</FormLabel>
              <FormControl>
                <Input placeholder="Nom de l'entreprise" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse *</FormLabel>
              <FormControl>
                <Input placeholder="123 Rue de la Paix" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Complement d'adresse (optionnel)</FormLabel>
              <FormControl>
                <Input placeholder="Appartement, etage, batiment..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code postal *</FormLabel>
                <FormControl>
                  <Input placeholder="75001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ville *</FormLabel>
                <FormControl>
                  <Input placeholder="Paris" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pays *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionnez un pays" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telephone *</FormLabel>
              <FormControl>
                <Input placeholder="+33 6 12 34 56 78" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showSaveOption && (
          <FormField
            control={form.control}
            name="saveAddress"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-normal">
                    Sauvegarder cette adresse pour mes prochaines commandes
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
        )}
      </form>
    </Form>
  );
}
```

### Composant AddressSelector

```typescript
// src/components/checkout/address-selector.tsx
"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string | null;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

interface AddressSelectorProps {
  addresses: Address[];
  selectedId?: string;
  onSelect: (address: Address) => void;
  onAddNew: () => void;
}

export function AddressSelector({
  addresses,
  selectedId,
  onSelect,
  onAddNew,
}: AddressSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Mes adresses enregistrees</h3>

      <div className="grid gap-4 md:grid-cols-2">
        {addresses.map((address) => (
          <Card
            key={address.id}
            className={cn(
              "cursor-pointer transition-colors hover:border-primary",
              selectedId === address.id && "border-primary bg-primary/5"
            )}
            onClick={() => onSelect(address)}
          >
            <CardContent className="p-4 relative">
              {selectedId === address.id && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}

              {address.isDefault && (
                <span className="text-xs bg-muted px-2 py-1 rounded-full mb-2 inline-block">
                  Adresse par defaut
                </span>
              )}

              <p className="font-medium">
                {address.firstName} {address.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {address.address1}
                {address.address2 && <>, {address.address2}</>}
              </p>
              <p className="text-sm text-muted-foreground">
                {address.postalCode} {address.city}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {address.phone}
              </p>
            </CardContent>
          </Card>
        ))}

        <Card
          className="cursor-pointer transition-colors hover:border-primary border-dashed"
          onClick={onAddNew}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center min-h-[150px] text-muted-foreground">
            <Plus className="h-8 w-8 mb-2" />
            <span>Ajouter une nouvelle adresse</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### API Creation Adresse

```typescript
// src/app/api/addresses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/client";
import { addressSchema } from "@/lib/validations/address.schema";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = addressSchema.parse(body);

    // Si c'est la premiere adresse, la marquer comme defaut
    const existingCount = await prisma.address.count({
      where: { userId: session.user.id },
    });

    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        company: validatedData.company,
        address1: validatedData.address1,
        address2: validatedData.address2,
        city: validatedData.city,
        state: validatedData.state,
        postalCode: validatedData.postalCode,
        country: validatedData.country,
        phone: validatedData.phone,
        isDefault: existingCount === 0,
      },
    });

    return NextResponse.json({ address });
  } catch (error) {
    console.error("Create address error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation de l'adresse" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: { isDefault: "desc" },
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Get addresses error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des adresses" },
      { status: 500 }
    );
  }
}
```

### References

- [Source: architecture.md#Address Model]
- [Source: prd.md#FR32]
- [Source: epics.md#Story 7.4]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
