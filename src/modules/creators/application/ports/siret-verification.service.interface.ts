import { Result } from '@/shared/domain/result';

/**
 * Result of SIRET verification from INSEE API
 */
export interface SiretVerificationResult {
  isValid: boolean;
  isActive: boolean;
  companyName: string;
  legalForm?: string;
  address?: {
    street: string;
    postalCode: string;
    city: string;
  };
  activityCode?: string; // NAF/APE code
  activityLabel?: string;
  creationDate?: Date;
}

/**
 * Verification status types
 */
export type VerificationStatus = 'VERIFIED' | 'INVALID' | 'PENDING_MANUAL' | 'ERROR';

/**
 * Port interface for SIRET verification service
 *
 * This interface defines the contract for external SIRET verification,
 * allowing different implementations (INSEE API, mock, etc.)
 */
export interface ISiretVerificationService {
  /**
   * Verifies a SIRET number against the official registry
   *
   * @param siret - The 14-digit SIRET number to verify
   * @returns Result containing verification data or error
   *
   * Possible errors:
   * - "SIRET_NOT_FOUND" - SIRET doesn't exist in registry
   * - "SIRET_INACTIVE" - Company/establishment is no longer active
   * - "TIMEOUT_API_INSEE" - API did not respond in time
   * - "API_ERROR" - General API error
   */
  verifySiret(siret: string): Promise<Result<SiretVerificationResult>>;
}
