import { Result } from '@/shared/domain/result';
import {
  ISiretVerificationService,
  SiretVerificationResult,
} from '../../application/ports/siret-verification.service.interface';

/**
 * data.gouv.fr API response types
 * API: https://entreprise.data.gouv.fr/api/sirene/v3/etablissements/{siret}
 */
interface DataGouvUniteLegale {
  denomination?: string;
  prenom_usuel?: string;
  nom?: string;
  categorie_juridique?: string;
}

interface DataGouvEtablissement {
  siret: string;
  unite_legale: DataGouvUniteLegale;
  geo_adresse?: string;
  numero_voie?: string;
  type_voie?: string;
  libelle_voie?: string;
  code_postal?: string;
  libelle_commune?: string;
  activite_principale?: string;
  date_creation?: string;
  etat_administratif?: string;
}

interface DataGouvApiResponse {
  etablissement: DataGouvEtablissement;
}

/**
 * NAF/APE code labels (most common ones)
 */
const NAF_LABELS: Record<string, string> = {
  '47.91Z': 'Vente à distance sur catalogue général',
  '47.99A': 'Vente à domicile',
  '47.99B': 'Vente par automates et autres commerces de détail hors magasin',
  '74.10Z': 'Activités spécialisées de design',
  '90.03A': 'Création artistique relevant des arts plastiques',
  '90.03B': 'Autre création artistique',
  '62.01Z': 'Programmation informatique',
  '63.12Z': 'Portails Internet',
  '73.11Z': 'Activités des agences de publicité',
  '74.20Z': 'Activités photographiques',
  '32.12Z': 'Fabrication d\'articles de joaillerie et bijouterie',
  '14.19Z': 'Fabrication d\'autres vêtements et accessoires',
  '18.12Z': 'Autre imprimerie (labeur)',
  '58.19Z': 'Autres activités d\'édition',
};

/**
 * data.gouv.fr Sirene API Service
 *
 * Verifies SIRET numbers against the official French business registry.
 * This API is FREE and doesn't require authentication.
 *
 * API documentation: https://entreprise.data.gouv.fr/api_doc/sirene
 */
export class DataGouvSiretService implements ISiretVerificationService {
  private readonly baseUrl = 'https://entreprise.data.gouv.fr/api/sirene/v3';
  private readonly timeout = 10000; // 10 seconds

  async verifySiret(siret: string): Promise<Result<SiretVerificationResult>> {
    // Validate SIRET format first
    const formatValidation = this.validateSiretFormat(siret);
    if (!formatValidation.isValid) {
      return Result.fail(formatValidation.error!);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/etablissements/${siret}`, {
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 404) {
        return Result.fail('SIRET non trouvé dans la base Sirene');
      }

      if (response.status === 429) {
        return Result.fail('Trop de requêtes. Veuillez réessayer dans quelques secondes.');
      }

      if (!response.ok) {
        return Result.fail(`Erreur API Sirene: ${response.status}`);
      }

      const data = (await response.json()) as DataGouvApiResponse;
      const etablissement = data.etablissement;
      const uniteLegale = etablissement.unite_legale;

      // Check if establishment is active
      const isActive = etablissement.etat_administratif === 'A';

      if (!isActive) {
        return Result.fail("Cet établissement n'est plus actif (fermé ou radié)");
      }

      // Build company name (denomination or individual name)
      const companyName =
        uniteLegale.denomination ||
        `${uniteLegale.prenom_usuel ?? ''} ${uniteLegale.nom ?? ''}`.trim() ||
        'Non renseigné';

      // Build address from individual fields
      const streetParts = [
        etablissement.numero_voie,
        etablissement.type_voie,
        etablissement.libelle_voie,
      ].filter(Boolean);

      const activityCode = etablissement.activite_principale?.replace('.', '') || undefined;
      const activityLabel = activityCode ? NAF_LABELS[etablissement.activite_principale || ''] : undefined;

      return Result.ok({
        isValid: true,
        isActive: true,
        companyName,
        legalForm: this.getLegalFormLabel(uniteLegale.categorie_juridique),
        address: {
          street: streetParts.join(' ') || etablissement.geo_adresse?.split(',')[0] || '',
          postalCode: etablissement.code_postal ?? '',
          city: etablissement.libelle_commune ?? '',
        },
        activityCode: etablissement.activite_principale,
        activityLabel,
        creationDate: etablissement.date_creation
          ? new Date(etablissement.date_creation)
          : undefined,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return Result.fail('Le service est temporairement indisponible. Veuillez réessayer.');
      }
      console.error('SIRET verification error:', error);
      return Result.fail('Erreur lors de la vérification du SIRET');
    }
  }

  /**
   * Validates SIRET format and checksum (Luhn algorithm)
   */
  private validateSiretFormat(siret: string): { isValid: boolean; error?: string } {
    // Remove spaces and dashes
    const cleaned = siret.replace(/[\s-]/g, '');

    // Check length
    if (cleaned.length !== 14) {
      return { isValid: false, error: 'Le SIRET doit contenir exactement 14 chiffres' };
    }

    // Check if all digits
    if (!/^\d{14}$/.test(cleaned)) {
      return { isValid: false, error: 'Le SIRET ne doit contenir que des chiffres' };
    }

    // Validate checksum using Luhn algorithm
    if (!this.validateLuhn(cleaned)) {
      return { isValid: false, error: 'Le numéro SIRET est invalide (somme de contrôle incorrecte)' };
    }

    return { isValid: true };
  }

  /**
   * Luhn algorithm validation for SIRET
   * The sum of (digit * weight) must be divisible by 10
   * Weights alternate between 1 and 2
   */
  private validateLuhn(siret: string): boolean {
    let sum = 0;
    for (let i = 0; i < 14; i++) {
      let digit = parseInt(siret.charAt(i), 10);
      // Multiply by 2 for even positions (0, 2, 4, 6, 8, 10, 12)
      if (i % 2 === 0) {
        digit *= 2;
        // If result is > 9, subtract 9 (equivalent to summing digits)
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
    }
    return sum % 10 === 0;
  }

  /**
   * Converts legal form code to human-readable label
   */
  private getLegalFormLabel(code?: string): string | undefined {
    if (!code) return undefined;

    const legalForms: Record<string, string> = {
      '1000': 'Entrepreneur individuel',
      '5498': 'EURL',
      '5499': 'SARL',
      '5710': 'SAS',
      '5720': 'SASU',
      '5505': 'SA',
      '5308': 'Société civile',
      '5202': 'Société en nom collectif',
      '9220': 'Association loi 1901',
      '1100': 'Artisan',
      '1200': 'Commerçant',
      '1300': 'Artisan-commerçant',
    };

    // Match by prefix if exact code not found
    const exactMatch = legalForms[code];
    if (exactMatch) return exactMatch;

    // Try prefix matching (first 2 digits)
    const prefix = code.slice(0, 2);
    const prefixMap: Record<string, string> = {
      '10': 'Entrepreneur individuel',
      '52': 'Société en nom collectif',
      '53': 'Société civile',
      '54': 'SARL',
      '55': 'SA',
      '56': 'Société en commandite',
      '57': 'SAS',
      '58': 'Société européenne',
      '92': 'Association',
    };

    return prefixMap[prefix];
  }
}

/**
 * Utility function for client-side SIRET validation
 * Can be imported directly in React components
 */
export function validateSiretClient(siret: string): { isValid: boolean; error?: string } {
  const cleaned = siret.replace(/[\s-]/g, '');

  if (cleaned.length === 0) {
    return { isValid: false, error: 'Le numéro SIRET est requis' };
  }

  if (cleaned.length !== 14) {
    return { isValid: false, error: `Le SIRET doit contenir 14 chiffres (actuellement ${cleaned.length})` };
  }

  if (!/^\d{14}$/.test(cleaned)) {
    return { isValid: false, error: 'Le SIRET ne doit contenir que des chiffres' };
  }

  // Luhn algorithm
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(cleaned.charAt(i), 10);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  if (sum % 10 !== 0) {
    return { isValid: false, error: 'Ce numéro SIRET est invalide' };
  }

  return { isValid: true };
}

/**
 * Format SIRET for display: XXX XXX XXX XXXXX
 */
export function formatSiret(siret: string): string {
  const cleaned = siret.replace(/[\s-]/g, '');
  if (cleaned.length !== 14) return siret;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9, 14)}`;
}
