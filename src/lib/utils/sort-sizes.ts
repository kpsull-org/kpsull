import type { SizeEntry } from './parse-sizes';

/**
 * Ordre canonique des tailles produit.
 * Les tailles présentes dans ce tableau sont triées selon l'ordre logique
 * du référentiel vestimentaire (unique, bébé, enfant, lettres, chiffres, W×L, chaussures).
 */
export const CANONICAL_SIZE_ORDER: readonly string[] = [
  // Taille unique
  'Unique',
  // Bébé (âge)
  '1 mois', '3 mois', '6 mois', '9 mois', '12 mois', '18 mois', '24 mois',
  // Enfant (âge)
  '2 ans', '3 ans', '4 ans', '5 ans', '6 ans', '7 ans', '8 ans', '10 ans', '12 ans', '14 ans',
  // Hauts — lettres (XS → 3XL)
  'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL',
  // Hauts — FR chiffres (tour de poitrine)
  '34', '36', '38', '40', '42', '44', '46', '48', '50', '52',
  // Pantalons — US waist (pouces)
  '28', '30', '32',
  // Pantalons — W×L US
  '30/30', '30/32', '32/30', '32/32', '34/30', '34/32', '36/30', '36/32',
  // Chaussures — EU (pointure européenne)
  '35', '37', '39', '41', '43', '45',
  // Chaussures — US Femme
  '5', '5.5', '6', '6.5', '7', '7.5', '8', '9', '10',
  // Chaussures — US Homme
  '8.5', '9.5', '10.5', '11', '12',
];

/**
 * Construit la map index → rang canonique (insensible à la casse).
 * Les tailles absentes de la liste canonique reçoivent un rang de Infinity.
 */
const CANONICAL_RANK: ReadonlyMap<string, number> = new Map(
  CANONICAL_SIZE_ORDER.map((size, idx) => [size.toLowerCase(), idx])
);

/**
 * Détermine si une chaîne représente un nombre pur (entier ou décimal simple).
 * Exemples : "36", "5.5", "10" → true ; "XL", "3XL", "1 mois" → false.
 */
function isNumeric(value: string): boolean {
  return /^\d+(\.\d+)?$/.test(value.trim());
}

/**
 * Compare deux tailles hors liste canonique.
 * - Si les deux sont numériques → comparaison numérique croissante
 * - Sinon → ordre alphabétique
 */
function compareFallback(a: string, b: string): number {
  if (isNumeric(a) && isNumeric(b)) {
    return parseFloat(a) - parseFloat(b);
  }
  return a.localeCompare(b, 'fr', { sensitivity: 'base' });
}

/**
 * Trie un tableau de SizeEntry selon l'ordre logique des tailles produit :
 * 1. "Unique" en premier
 * 2. Tailles présentes dans CANONICAL_SIZE_ORDER, dans leur ordre canonique
 * 3. Tailles inconnues : numériques croissantes, puis alphabétiques
 *
 * La fonction est pure et ne mute pas le tableau d'entrée.
 */
export function sortSizes(sizes: SizeEntry[]): SizeEntry[] {
  return [...sizes].sort((a, b) => {
    const rankA = CANONICAL_RANK.get(a.size.toLowerCase()) ?? Infinity;
    const rankB = CANONICAL_RANK.get(b.size.toLowerCase()) ?? Infinity;

    if (rankA !== Infinity || rankB !== Infinity) {
      return rankA - rankB;
    }

    // Les deux tailles sont hors liste canonique → comparaison de repli
    return compareFallback(a.size, b.size);
  });
}
