import { ValueObject } from '@/shared/domain/value-object.base';
import { Result } from '@/shared/domain/result';

interface SiretProps {
  value: string;
}

/**
 * Siret Value Object
 *
 * Represents a French SIRET number (Système d'Identification du Répertoire des Établissements).
 * SIRET = SIREN (9 digits) + NIC (5 digits) = 14 digits total.
 *
 * Validation includes:
 * - Exactly 14 digits
 * - Luhn checksum validation
 */
export class Siret extends ValueObject<SiretProps> {
  private constructor(props: SiretProps) {
    super(props);
  }

  /**
   * Creates a new Siret Value Object
   *
   * @param siret - The SIRET number (can contain spaces, will be normalized)
   */
  static create(siret: string): Result<Siret> {
    // Normalize: remove spaces
    const normalized = siret.replace(/\s/g, '');

    // Validation: required
    if (!normalized || normalized.length === 0) {
      return Result.fail('Le SIRET est requis');
    }

    // Validation: exactly 14 digits
    if (normalized.length !== 14) {
      return Result.fail('Le SIRET doit contenir exactement 14 chiffres');
    }

    // Validation: only digits
    if (!/^\d{14}$/.test(normalized)) {
      return Result.fail('Le SIRET doit contenir des chiffres uniquement');
    }

    // Validation: Luhn checksum
    if (!Siret.validateLuhn(normalized)) {
      return Result.fail('Le numéro SIRET est invalide (somme de contrôle incorrecte)');
    }

    return Result.ok(new Siret({ value: normalized }));
  }

  /**
   * Validates the Luhn checksum for a SIRET number
   *
   * For SIRET, we double digits at even positions (2nd, 4th, 6th, etc. - 1-indexed)
   * which translates to odd indexes (1, 3, 5, etc. - 0-indexed).
   * If doubled digit > 9, subtract 9.
   * Sum all digits. Valid if sum % 10 === 0.
   */
  private static validateLuhn(siret: string): boolean {
    let sum = 0;

    for (let i = 0; i < 14; i++) {
      let digit = parseInt(siret.charAt(i), 10);

      // Double digits at positions 2, 4, 6, ... (1-indexed) = indexes 1, 3, 5, ... (0-indexed)
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
    }

    return sum % 10 === 0;
  }

  /**
   * The raw SIRET value (14 digits)
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * The SIREN (first 9 digits)
   */
  get siren(): string {
    return this.props.value.substring(0, 9);
  }

  /**
   * The NIC (last 5 digits)
   */
  get nic(): string {
    return this.props.value.substring(9, 14);
  }

  /**
   * Formatted SIRET with spaces (XXX XXX XXX XXXXX)
   */
  get formatted(): string {
    const v = this.props.value;
    return `${v.substring(0, 3)} ${v.substring(3, 6)} ${v.substring(6, 9)} ${v.substring(9, 14)}`;
  }
}
