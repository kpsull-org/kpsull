import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DataGouvSiretService, validateSiretClient, formatSiret } from '../data-gouv-siret.service';

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Sample API response for MECA SERVICES (real data shape)
const VALID_API_RESPONSE = {
  results: [
    {
      siren: '878691294',
      nom_complet: 'MECA SERVICES',
      nom_raison_sociale: 'MECA SERVICES',
      nature_juridique: '5720',
      siege: {
        siret: '87869129400010',
        activite_principale: '33.12Z',
        activite_principale_registre_metier: '9522ZA',
        date_creation: '2019-11-04',
        etat_administratif: 'A',
        geo_adresse: '4 La Merrerie 50570 Carantilly',
        numero_voie: '4',
        type_voie: null,
        libelle_voie: 'LA MERRERIE',
        code_postal: '50570',
        libelle_commune: 'CARANTILLY',
      },
      activite_principale: '33.12Z',
      date_creation: '2019-11-04',
      etat_administratif: 'A',
      matching_etablissements: [
        {
          siret: '87869129400010',
          activite_principale: '33.12Z',
          activite_principale_registre_metier: '9522ZA',
          date_creation: '2019-11-04',
          etat_administratif: 'A',
          geo_adresse: '4 La Merrerie 50570 Carantilly',
          numero_voie: '4',
          type_voie: null,
          libelle_voie: 'LA MERRERIE',
          code_postal: '50570',
          libelle_commune: 'CARANTILLY',
        },
      ],
    },
  ],
  total_results: 1,
};

const INACTIVE_API_RESPONSE = {
  results: [
    {
      ...VALID_API_RESPONSE.results[0],
      siege: {
        ...VALID_API_RESPONSE.results[0]!.siege,
        etat_administratif: 'F',
      },
      matching_etablissements: [
        {
          ...VALID_API_RESPONSE.results[0]!.matching_etablissements[0],
          etat_administratif: 'F',
        },
      ],
    },
  ],
  total_results: 1,
};

const EMPTY_API_RESPONSE = {
  results: [],
  total_results: 0,
};

describe('DataGouvSiretService', () => {
  let service: DataGouvSiretService;

  beforeEach(() => {
    service = new DataGouvSiretService();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('verifySiret', () => {
    it('should return valid result for active SIRET', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => VALID_API_RESPONSE,
      });

      const result = await service.verifySiret('87869129400010');

      expect(result.isSuccess).toBe(true);
      expect(result.value.isValid).toBe(true);
      expect(result.value.isActive).toBe(true);
      expect(result.value.companyName).toBe('MECA SERVICES');
      expect(result.value.address).toEqual({
        street: '4 LA MERRERIE',
        postalCode: '50570',
        city: 'CARANTILLY',
      });
    });

    it('should call API with correct URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => VALID_API_RESPONSE,
      });

      await service.verifySiret('87869129400010');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://recherche-entreprises.api.gouv.fr/search?q=87869129400010',
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: 'application/json',
          }),
        })
      );
    });

    it('should resolve legal form from nature_juridique code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => VALID_API_RESPONSE,
      });

      const result = await service.verifySiret('87869129400010');

      expect(result.isSuccess).toBe(true);
      expect(result.value.legalForm).toBe('SASU');
    });

    it('should fail for inactive establishment', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => INACTIVE_API_RESPONSE,
      });

      const result = await service.verifySiret('87869129400010');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('plus actif');
    });

    it('should fail when SIRET not found (empty results)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => EMPTY_API_RESPONSE,
      });

      const result = await service.verifySiret('87869129400010');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvé');
    });

    it.each([
      { label: 'API error (500)', mockSetup: () => mockFetch.mockResolvedValueOnce({ ok: false, status: 500 }), errorContains: 'Erreur API' },
      { label: 'rate limit (429)', mockSetup: () => mockFetch.mockResolvedValueOnce({ ok: false, status: 429 }), errorContains: 'Trop de requêtes' },
    ])('should fail on $label', async ({ mockSetup, errorContains }) => {
      mockSetup();

      const result = await service.verifySiret('87869129400010');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain(errorContains);
    });

    it('should return timeout error when request times out', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const result = await service.verifySiret('87869129400010');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('temporairement indisponible');
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.verifySiret('87869129400010');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Erreur');
    });

    it('should use siege when matching_etablissements has no match', async () => {
      const responseWithNoMatch = {
        results: [
          {
            ...VALID_API_RESPONSE.results[0],
            matching_etablissements: [],
          },
        ],
        total_results: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseWithNoMatch,
      });

      const result = await service.verifySiret('87869129400010');

      expect(result.isSuccess).toBe(true);
      expect(result.value.address?.postalCode).toBe('50570');
    });

    it('should fallback to siege when matching_etablissements has empty address fields', async () => {
      const responseWithIncompleteMatch = {
        results: [
          {
            ...VALID_API_RESPONSE.results[0],
            matching_etablissements: [
              {
                siret: '87869129400010',
                activite_principale: '33.12Z',
                activite_principale_registre_metier: null,
                date_creation: '2019-11-04',
                etat_administratif: 'A',
                geo_adresse: null,
                numero_voie: null,
                type_voie: null,
                libelle_voie: null,
                code_postal: '50570',
                libelle_commune: 'CARANTILLY',
              },
            ],
          },
        ],
        total_results: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseWithIncompleteMatch,
      });

      const result = await service.verifySiret('87869129400010');

      expect(result.isSuccess).toBe(true);
      expect(result.value.address?.street).toBe('4 LA MERRERIE');
      expect(result.value.address?.postalCode).toBe('50570');
      expect(result.value.address?.city).toBe('CARANTILLY');
    });

    it('should fallback to geo_adresse when street fields are missing', async () => {
      const responseWithGeoOnly = {
        results: [
          {
            ...VALID_API_RESPONSE.results[0],
            siege: {
              ...VALID_API_RESPONSE.results[0]!.siege,
              numero_voie: null,
              type_voie: null,
              libelle_voie: null,
              geo_adresse: '4 La Merrerie, 50570 Carantilly',
            },
            matching_etablissements: [],
          },
        ],
        total_results: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseWithGeoOnly,
      });

      const result = await service.verifySiret('87869129400010');

      expect(result.isSuccess).toBe(true);
      expect(result.value.address?.street).toBe('4 La Merrerie');
    });
  });

  describe('format validation', () => {
    it('should reject SIRET with wrong length', async () => {
      const result = await service.verifySiret('1234');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('14 chiffres');
    });

    it('should reject SIRET with non-digit characters', async () => {
      const result = await service.verifySiret('8786912940001A');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('chiffres');
    });

    it('should reject SIRET with invalid Luhn checksum', async () => {
      const result = await service.verifySiret('87869129400011');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('invalide');
    });
  });

  describe('getLegalFormLabel (prefix matching)', () => {
    it('should return a prefix-matched label for an unknown exact code with known prefix', async () => {
      // nature_juridique = '5201' → no exact match → prefix '52' → 'Société en nom collectif'
      const responseWithPrefixCode = {
        results: [
          {
            ...VALID_API_RESPONSE.results[0],
            nature_juridique: '5201',
          },
        ],
        total_results: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseWithPrefixCode,
      });

      const result = await service.verifySiret('87869129400010');

      expect(result.isSuccess).toBe(true);
      expect(result.value.legalForm).toBe('Société en nom collectif');
    });

    it('should return undefined legalForm for a code with no match at all', async () => {
      // nature_juridique = '9999' → no exact match, no prefix match
      const responseWithUnknownCode = {
        results: [
          {
            ...VALID_API_RESPONSE.results[0],
            nature_juridique: '9999',
          },
        ],
        total_results: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseWithUnknownCode,
      });

      const result = await service.verifySiret('87869129400010');

      expect(result.isSuccess).toBe(true);
      expect(result.value.legalForm).toBeUndefined();
    });
  });
});

describe('validateSiretClient', () => {
  it.each([
    { label: 'empty string', siret: '', errorContains: 'requis' },
    { label: 'wrong length', siret: '12345', errorContains: '14 chiffres' },
    { label: 'non-digit characters', siret: '1234567890123A', errorContains: 'chiffres' },
    { label: 'failed Luhn checksum', siret: '87869129400011', errorContains: 'invalide' },
  ])('should return invalid for $label', ({ siret, errorContains }) => {
    const result = validateSiretClient(siret);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain(errorContains);
  });

  it('should return valid for a correct SIRET', () => {
    const result = validateSiretClient('87869129400010');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should strip spaces and dashes before validation', () => {
    const result = validateSiretClient('878 691 294 00010');
    expect(result.isValid).toBe(true);
  });
});

describe('formatSiret', () => {
  it('should format a 14-digit SIRET correctly', () => {
    const result = formatSiret('87869129400010');
    expect(result).toBe('878 691 294 00010');
  });

  it('should return original string for non-14-digit input', () => {
    const result = formatSiret('1234');
    expect(result).toBe('1234');
  });

  it('should strip spaces before formatting', () => {
    const result = formatSiret('878 691 294 00010');
    expect(result).toBe('878 691 294 00010');
  });
});
