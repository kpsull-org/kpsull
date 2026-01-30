import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { InseeSiretService } from '../insee-siret.service';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Sample INSEE API response for a valid SIRET
const VALID_INSEE_RESPONSE = {
  etablissement: {
    siret: '80295478500028',
    uniteLegale: {
      denominationUniteLegale: 'MA SUPER ENTREPRISE',
      categorieJuridiqueUniteLegale: '5499',
    },
    adresseEtablissement: {
      numeroVoieEtablissement: '10',
      typeVoieEtablissement: 'RUE',
      libelleVoieEtablissement: 'DE LA PAIX',
      codePostalEtablissement: '75001',
      libelleCommuneEtablissement: 'PARIS',
    },
    activitePrincipaleEtablissement: '62.01Z',
    dateCreationEtablissement: '2020-01-15',
    periodesEtablissement: [
      {
        etatAdministratifEtablissement: 'A', // A = Actif
      },
    ],
  },
};

// Sample response for inactive establishment
const INACTIVE_INSEE_RESPONSE = {
  etablissement: {
    ...VALID_INSEE_RESPONSE.etablissement,
    periodesEtablissement: [
      {
        etatAdministratifEtablissement: 'F', // F = Fermé
      },
    ],
  },
};

describe('InseeSiretService', () => {
  let service: InseeSiretService;

  beforeEach(() => {
    vi.stubEnv('INSEE_API_KEY', 'test-api-key');
    service = new InseeSiretService();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('verifySiret', () => {
    it('should return valid result for active SIRET', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => VALID_INSEE_RESPONSE,
      });

      const result = await service.verifySiret('80295478500028');

      expect(result.isSuccess).toBe(true);
      expect(result.value.isValid).toBe(true);
      expect(result.value.isActive).toBe(true);
      expect(result.value.companyName).toBe('MA SUPER ENTREPRISE');
      expect(result.value.address).toEqual({
        street: '10 RUE DE LA PAIX',
        postalCode: '75001',
        city: 'PARIS',
      });
      expect(result.value.activityCode).toBe('62.01Z');
    });

    it('should call INSEE API with correct URL and headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => VALID_INSEE_RESPONSE,
      });

      await service.verifySiret('80295478500028');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/siret/80295478500028'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
            Accept: 'application/json',
          }),
        })
      );
    });

    it('should fail for inactive establishment', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => INACTIVE_INSEE_RESPONSE,
      });

      const result = await service.verifySiret('80295478500028');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('plus actif');
    });

    it('should fail when SIRET not found (404)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await service.verifySiret('99999999999999');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvé');
    });

    it('should fail on API error (500)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await service.verifySiret('80295478500028');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Erreur API');
    });

    it('should return TIMEOUT error when request times out', async () => {
      // Simulate abort error
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const result = await service.verifySiret('80295478500028');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('TIMEOUT_API_INSEE');
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.verifySiret('80295478500028');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Erreur');
    });

    it('should handle individual entrepreneur name format', async () => {
      const individualResponse = {
        etablissement: {
          ...VALID_INSEE_RESPONSE.etablissement,
          uniteLegale: {
            denominationUniteLegale: null,
            prenomUsuelUniteLegale: 'JEAN',
            nomUniteLegale: 'DUPONT',
            categorieJuridiqueUniteLegale: '1000',
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => individualResponse,
      });

      const result = await service.verifySiret('80295478500028');

      expect(result.isSuccess).toBe(true);
      expect(result.value.companyName).toBe('JEAN DUPONT');
    });
  });
});
