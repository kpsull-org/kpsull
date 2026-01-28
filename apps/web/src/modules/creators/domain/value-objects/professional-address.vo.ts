import { ValueObject } from '@/shared/domain/value-object.base';
import { Result } from '@/shared/domain/result';

interface ProfessionalAddressProps {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

interface CreateAddressInput {
  street: string;
  city: string;
  postalCode: string;
  country?: string;
}

const MAX_STREET_LENGTH = 255;
const MAX_CITY_LENGTH = 100;
const POSTAL_CODE_REGEX = /^\d{5}$/;
const DEFAULT_COUNTRY = 'France';

/**
 * ProfessionalAddress Value Object
 *
 * Represents a French professional address with validation.
 *
 * Validation includes:
 * - Required street, city, and postal code
 * - French postal code format (5 digits)
 * - Maximum lengths for street and city
 */
export class ProfessionalAddress extends ValueObject<ProfessionalAddressProps> {
  private constructor(props: ProfessionalAddressProps) {
    super(props);
  }

  /**
   * Creates a new ProfessionalAddress Value Object
   */
  static create(input: CreateAddressInput): Result<ProfessionalAddress> {
    const { street, city, postalCode, country = DEFAULT_COUNTRY } = input;

    // Normalize: trim whitespace
    const trimmedStreet = street?.trim() || '';
    const trimmedCity = city?.trim() || '';
    const trimmedPostalCode = postalCode?.trim() || '';
    const trimmedCountry = country?.trim() || DEFAULT_COUNTRY;

    // Validation: street required
    if (!trimmedStreet) {
      return Result.fail("L'adresse est requise");
    }

    // Validation: street max length
    if (trimmedStreet.length > MAX_STREET_LENGTH) {
      return Result.fail(`L'adresse ne peut pas dépasser ${MAX_STREET_LENGTH} caractères`);
    }

    // Validation: city required
    if (!trimmedCity) {
      return Result.fail('La ville est requise');
    }

    // Validation: city max length
    if (trimmedCity.length > MAX_CITY_LENGTH) {
      return Result.fail(`La ville ne peut pas dépasser ${MAX_CITY_LENGTH} caractères`);
    }

    // Validation: postal code required
    if (!trimmedPostalCode) {
      return Result.fail('Le code postal est requis');
    }

    // Validation: French postal code format (5 digits)
    if (!POSTAL_CODE_REGEX.test(trimmedPostalCode)) {
      return Result.fail('Le code postal doit contenir exactement 5 chiffres');
    }

    return Result.ok(
      new ProfessionalAddress({
        street: trimmedStreet,
        city: trimmedCity,
        postalCode: trimmedPostalCode,
        country: trimmedCountry,
      })
    );
  }

  /**
   * The street address
   */
  get street(): string {
    return this.props.street;
  }

  /**
   * The city
   */
  get city(): string {
    return this.props.city;
  }

  /**
   * The postal code
   */
  get postalCode(): string {
    return this.props.postalCode;
  }

  /**
   * The country
   */
  get country(): string {
    return this.props.country;
  }

  /**
   * Full formatted address with country
   */
  get formatted(): string {
    return `${this.props.street}, ${this.props.postalCode} ${this.props.city}, ${this.props.country}`;
  }

  /**
   * Single line format without country
   */
  get oneLine(): string {
    return `${this.props.street}, ${this.props.postalCode} ${this.props.city}`;
  }
}
