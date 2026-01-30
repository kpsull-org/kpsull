import { Result } from '@/shared/domain/result';
import {
  ISiretVerificationService,
  SiretVerificationResult,
} from '../../application/ports/siret-verification.service.interface';

/**
 * Mock SIRET Verification Service
 *
 * For development and testing purposes.
 * Returns fake but valid-looking data for any valid SIRET format.
 */
export class MockSiretService implements ISiretVerificationService {
  // Known test SIRETs and their mock responses
  private readonly mockData: Record<string, SiretVerificationResult> = {
    '80295478500028': {
      isValid: true,
      isActive: true,
      companyName: 'KPSULL DEMO SARL',
      legalForm: '5499',
      address: {
        street: '10 RUE DE LA PAIX',
        postalCode: '75001',
        city: 'PARIS',
      },
      activityCode: '62.01Z',
      activityLabel: 'Programmation informatique',
      creationDate: new Date('2020-01-15'),
    },
    '44306184100043': {
      isValid: true,
      isActive: true,
      companyName: 'TEST ENTREPRISE SAS',
      legalForm: '5710',
      address: {
        street: '25 AVENUE DES CHAMPS ELYSEES',
        postalCode: '75008',
        city: 'PARIS',
      },
      activityCode: '47.91Z',
      activityLabel: 'Vente à distance sur catalogue général',
      creationDate: new Date('2019-06-20'),
    },
  };

  // SIRET that will simulate inactive establishment
  private readonly inactiveSirets = ['11111111111111'];

  // SIRET that will simulate timeout
  private readonly timeoutSirets = ['99999999999990'];

  async verifySiret(siret: string): Promise<Result<SiretVerificationResult>> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Simulate timeout for specific SIRETs
    if (this.timeoutSirets.includes(siret)) {
      return Result.fail('TIMEOUT_API_INSEE');
    }

    // Simulate inactive establishment
    if (this.inactiveSirets.includes(siret)) {
      return Result.fail("Cet établissement n'est plus actif");
    }

    // Return known mock data
    if (this.mockData[siret]) {
      return Result.ok(this.mockData[siret]);
    }

    // For any other valid format SIRET, generate mock data
    if (/^\d{14}$/.test(siret)) {
      return Result.ok({
        isValid: true,
        isActive: true,
        companyName: `ENTREPRISE ${siret.substring(0, 9)}`,
        legalForm: '5499',
        address: {
          street: '1 RUE DU COMMERCE',
          postalCode: '75000',
          city: 'PARIS',
        },
        activityCode: '47.91Z',
        creationDate: new Date('2021-01-01'),
      });
    }

    return Result.fail('SIRET non trouvé dans la base INSEE');
  }
}
