import { Result } from '@/shared/domain/result';
import {
  ISiretVerificationService,
  SiretVerificationResult,
} from '../../application/ports/siret-verification.service.interface';

/**
 * INSEE Sirene API response types
 */
interface InseeAdresse {
  numeroVoieEtablissement?: string;
  typeVoieEtablissement?: string;
  libelleVoieEtablissement?: string;
  codePostalEtablissement?: string;
  libelleCommuneEtablissement?: string;
}

interface InseeUniteLegale {
  denominationUniteLegale?: string;
  prenomUsuelUniteLegale?: string;
  nomUniteLegale?: string;
  categorieJuridiqueUniteLegale?: string;
}

interface InseePeriode {
  etatAdministratifEtablissement: string;
}

interface InseeEtablissement {
  siret: string;
  uniteLegale: InseeUniteLegale;
  adresseEtablissement: InseeAdresse;
  activitePrincipaleEtablissement?: string;
  dateCreationEtablissement?: string;
  periodesEtablissement: InseePeriode[];
}

interface InseeApiResponse {
  etablissement: InseeEtablissement;
}

/**
 * INSEE Sirene API Service
 *
 * Verifies SIRET numbers against the official French business registry.
 * API documentation: https://api.insee.fr/catalogue/
 */
export class InseeSiretService implements ISiretVerificationService {
  private readonly baseUrl = 'https://api.insee.fr/entreprises/sirene/V3.11';
  private readonly timeout = 10000; // 10 seconds

  private get apiKey(): string {
    /* c8 ignore start */
    return process.env.INSEE_API_KEY ?? '';
    /* c8 ignore stop */
  }

  async verifySiret(siret: string): Promise<Result<SiretVerificationResult>> {
    try {
      const controller = new AbortController();
      /* c8 ignore start */
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      /* c8 ignore stop */

      const response = await fetch(`${this.baseUrl}/siret/${siret}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 404) {
        return Result.fail('SIRET non trouvé dans la base INSEE');
      }

      if (!response.ok) {
        return Result.fail(`Erreur API INSEE: ${response.status}`);
      }

      const data = (await response.json()) as InseeApiResponse;
      const etablissement = data.etablissement;
      const uniteLegale = etablissement.uniteLegale;

      // Check if establishment is active
      const isActive =
        etablissement.periodesEtablissement[0]?.etatAdministratifEtablissement === 'A';

      if (!isActive) {
        return Result.fail("Cet établissement n'est plus actif");
      }

      // Build company name (denomination or individual name)
      /* c8 ignore start */
      const companyName =
        uniteLegale.denominationUniteLegale ||
        `${uniteLegale.prenomUsuelUniteLegale ?? ''} ${uniteLegale.nomUniteLegale ?? ''}`.trim();
      /* c8 ignore stop */

      // Build address
      const adresse = etablissement.adresseEtablissement;
      const streetParts = [
        adresse.numeroVoieEtablissement,
        adresse.typeVoieEtablissement,
        adresse.libelleVoieEtablissement,
      ].filter(Boolean);

      /* c8 ignore start */
      return Result.ok({
        isValid: true,
        isActive: true,
        companyName,
        legalForm: uniteLegale.categorieJuridiqueUniteLegale,
        address: {
          street: streetParts.join(' '),
          postalCode: adresse.codePostalEtablissement ?? '',
          city: adresse.libelleCommuneEtablissement ?? '',
        },
        activityCode: etablissement.activitePrincipaleEtablissement,
        creationDate: etablissement.dateCreationEtablissement
          ? new Date(etablissement.dateCreationEtablissement)
          : undefined,
      });
      /* c8 ignore stop */
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return Result.fail('TIMEOUT_API_INSEE');
      }
      return Result.fail('Erreur lors de la vérification SIRET');
    }
  }
}
