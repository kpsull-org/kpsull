# Story 2.3: Vérification SIRET via API INSEE

Status: ready-for-dev

## Story

As a Client en cours d'upgrade,
I want que mon SIRET soit vérifié automatiquement,
so that la plateforme s'assure de la légitimité de mon activité.

## Acceptance Criteria

1. **AC1 - Vérification automatique via API INSEE**
   - **Given** un Client ayant saisi son SIRET (étape 2)
   - **When** le système vérifie via l'API INSEE/Sirene
   - **Then** une requête est envoyée à l'API avec le SIRET

2. **AC2 - SIRET valide et actif**
   - **Given** un SIRET existant et actif dans l'API
   - **When** la vérification réussit
   - **Then** les informations entreprise sont affichées (raison sociale, adresse)
   - **And** l'utilisateur peut confirmer et passer à l'étape suivante
   - **And** siretVerified est mis à true avec siretVerifiedAt

3. **AC3 - SIRET invalide ou inactif**
   - **Given** un SIRET invalide ou inactif
   - **When** la vérification échoue
   - **Then** un message d'erreur clair est affiché
   - **And** l'utilisateur peut corriger et réessayer

4. **AC4 - API INSEE indisponible**
   - **Given** l'API INSEE indisponible
   - **When** la vérification échoue par timeout
   - **Then** le SIRET est marqué "en attente de validation manuelle"
   - **And** l'utilisateur peut continuer avec un avertissement

## Tasks / Subtasks

- [ ] **Task 1: Créer le service INSEE** (AC: #1)
  - [ ] 1.1 Créer `src/modules/creators/application/ports/siret-verification.service.interface.ts`
  - [ ] 1.2 Créer `src/modules/creators/infrastructure/services/insee-siret.service.ts`
  - [ ] 1.3 Configurer les variables d'environnement INSEE_API_KEY
  - [ ] 1.4 Implémenter la méthode `verifySiret(siret: string)`

- [ ] **Task 2: Créer la page étape 2** (AC: #2, #3)
  - [ ] 2.1 Créer `src/app/(auth)/onboarding/creator/step/2/page.tsx`
  - [ ] 2.2 Afficher le SIRET saisi et lancer la vérification automatique
  - [ ] 2.3 Afficher les informations entreprise si valide
  - [ ] 2.4 Afficher les erreurs si invalide

- [ ] **Task 3: Créer le use case VerifySiret** (AC: #1, #2, #3, #4)
  - [ ] 3.1 Créer `src/modules/creators/application/use-cases/verify-siret.use-case.ts`
  - [ ] 3.2 Appeler le service INSEE
  - [ ] 3.3 Gérer les cas de succès, échec et timeout
  - [ ] 3.4 Mettre à jour siretVerified et siretVerifiedAt

- [ ] **Task 4: Implémenter le fallback validation manuelle** (AC: #4)
  - [ ] 4.1 Créer le statut "PENDING_MANUAL_VERIFICATION"
  - [ ] 4.2 Permettre la continuation avec avertissement
  - [ ] 4.3 Notifier un admin pour validation manuelle ultérieure

- [ ] **Task 5: Écrire les tests** (AC: #1-4)
  - [ ] 5.1 Tests unitaires pour InseeService (mock API)
  - [ ] 5.2 Tests unitaires pour le use case
  - [ ] 5.3 Tests de gestion des erreurs et timeouts

## Dev Notes

### Interface Service INSEE

```typescript
// src/modules/creators/application/ports/siret-verification.service.interface.ts
export interface SiretVerificationResult {
  isValid: boolean;
  isActive: boolean;
  companyName?: string;
  legalForm?: string;
  address?: {
    street: string;
    postalCode: string;
    city: string;
  };
  activityCode?: string; // NAF/APE
  activityLabel?: string;
  creationDate?: Date;
}

export interface ISiretVerificationService {
  verifySiret(siret: string): Promise<Result<SiretVerificationResult>>;
}
```

### Implémentation Service INSEE

```typescript
// src/modules/creators/infrastructure/services/insee-siret.service.ts
import { Result } from "@/shared/domain";

export class InseeSiretService implements ISiretVerificationService {
  private readonly baseUrl = "https://api.insee.fr/entreprises/sirene/V3.11";
  private readonly apiKey: string;
  private readonly timeout = 10000; // 10 seconds

  constructor() {
    this.apiKey = process.env.INSEE_API_KEY!;
  }

  async verifySiret(siret: string): Promise<Result<SiretVerificationResult>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${this.baseUrl}/siret/${siret}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: "application/json",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.status === 404) {
        return Result.fail("SIRET non trouvé dans la base INSEE");
      }

      if (!response.ok) {
        return Result.fail(`Erreur API INSEE: ${response.status}`);
      }

      const data = await response.json();
      const etablissement = data.etablissement;
      const uniteLegale = etablissement.uniteLegale;

      // Vérifier si l'établissement est actif
      const isActive = etablissement.periodesEtablissement[0]?.etatAdministratifEtablissement === "A";

      if (!isActive) {
        return Result.fail("Cet établissement n'est plus actif");
      }

      return Result.ok({
        isValid: true,
        isActive,
        companyName: uniteLegale.denominationUniteLegale ||
                     `${uniteLegale.prenomUsuelUniteLegale} ${uniteLegale.nomUniteLegale}`,
        legalForm: uniteLegale.categorieJuridiqueUniteLegale,
        address: {
          street: `${etablissement.adresseEtablissement.numeroVoieEtablissement || ""} ${etablissement.adresseEtablissement.typeVoieEtablissement || ""} ${etablissement.adresseEtablissement.libelleVoieEtablissement || ""}`.trim(),
          postalCode: etablissement.adresseEtablissement.codePostalEtablissement,
          city: etablissement.adresseEtablissement.libelleCommuneEtablissement,
        },
        activityCode: etablissement.activitePrincipaleEtablissement,
        creationDate: new Date(etablissement.dateCreationEtablissement),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return Result.fail("TIMEOUT_API_INSEE");
      }
      return Result.fail("Erreur lors de la vérification SIRET");
    }
  }
}
```

### Use Case avec gestion du fallback

```typescript
// src/modules/creators/application/use-cases/verify-siret.use-case.ts
export class VerifySiretUseCase implements IUseCase<VerifySiretDTO, VerifySiretResultDTO> {
  constructor(
    private readonly siretService: ISiretVerificationService,
    private readonly creatorRepo: ICreatorRepository
  ) {}

  async execute(dto: VerifySiretDTO): Promise<Result<VerifySiretResultDTO>> {
    const verificationResult = await this.siretService.verifySiret(dto.siret);

    if (verificationResult.isFailure) {
      if (verificationResult.error === "TIMEOUT_API_INSEE") {
        // Fallback: allow continuation with manual verification pending
        await this.creatorRepo.updateOnboarding(dto.userId, {
          siretVerificationStatus: "PENDING_MANUAL",
          siretVerifiedAt: null,
        });

        return Result.ok({
          status: "PENDING_MANUAL",
          message: "L'API INSEE est temporairement indisponible. Votre SIRET sera vérifié manuellement.",
          canContinue: true,
        });
      }

      return Result.fail(verificationResult.error!);
    }

    // SIRET verified successfully
    await this.creatorRepo.updateOnboarding(dto.userId, {
      siretVerified: true,
      siretVerifiedAt: new Date(),
      companyInfo: verificationResult.value,
    });

    return Result.ok({
      status: "VERIFIED",
      companyInfo: verificationResult.value,
      canContinue: true,
    });
  }
}
```

### Variables d'Environnement

```bash
# .env.local
INSEE_API_KEY="your-insee-api-key"
# Obtenir sur https://api.insee.fr/catalogue/
```

### Références

- [Source: architecture.md#External Integrations]
- [Source: architecture.md#NFR-INT-3]
- [Source: prd.md#FR5]
- [Source: epics.md#Story 2.3]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
