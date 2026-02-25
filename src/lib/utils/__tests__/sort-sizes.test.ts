import { describe, it, expect } from 'vitest';
import { sortSizes, CANONICAL_SIZE_ORDER } from '../sort-sizes';
import type { SizeEntry } from '../parse-sizes';

function entries(...sizes: string[]): SizeEntry[] {
  return sizes.map((size) => ({ size }));
}

function labels(sorted: SizeEntry[]): string[] {
  return sorted.map((e) => e.size);
}

describe('CANONICAL_SIZE_ORDER', () => {
  it('commence par Unique', () => {
    expect(CANONICAL_SIZE_ORDER[0]).toBe('Unique');
  });

  it('contient les tailles lettres dans le bon ordre', () => {
    const letterSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
    const indices = letterSizes.map((s) => CANONICAL_SIZE_ORDER.indexOf(s));
    for (let i = 1; i < indices.length; i++) {
      expect(indices[i]).toBeGreaterThan(indices[i - 1] ?? -1);
    }
  });

  it('ne contient pas de doublons', () => {
    const lower = CANONICAL_SIZE_ORDER.map((s) => s.toLowerCase());
    expect(new Set(lower).size).toBe(lower.length);
  });
});

describe('sortSizes', () => {
  it('retourne un tableau vide pour une entrée vide', () => {
    expect(sortSizes([])).toEqual([]);
  });

  it('ne mute pas le tableau original', () => {
    const input = entries('L', 'S', 'M');
    const original = [...input];
    sortSizes(input);
    expect(input).toEqual(original);
  });

  it('place "Unique" en premier', () => {
    const result = sortSizes(entries('XL', 'Unique', 'M'));
    expect(labels(result)[0]).toBe('Unique');
  });

  it('trie les tailles lettres dans l\'ordre logique', () => {
    const result = sortSizes(entries('XXL', 'S', 'XL', 'XS', 'M', 'L', '3XL'));
    expect(labels(result)).toEqual(['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']);
  });

  it('trie les tailles numériques dans l\'ordre canonique', () => {
    const result = sortSizes(entries('44', '36', '40', '38'));
    expect(labels(result)).toEqual(['36', '38', '40', '44']);
  });

  it('trie les tailles bébé dans l\'ordre chronologique', () => {
    const result = sortSizes(entries('18 mois', '3 mois', '6 mois', '1 mois'));
    expect(labels(result)).toEqual(['1 mois', '3 mois', '6 mois', '18 mois']);
  });

  it('trie les tailles enfant dans l\'ordre chronologique', () => {
    const result = sortSizes(entries('10 ans', '3 ans', '7 ans', '2 ans'));
    expect(labels(result)).toEqual(['2 ans', '3 ans', '7 ans', '10 ans']);
  });

  it('trie les tailles W×L dans l\'ordre canonique', () => {
    const result = sortSizes(entries('36/32', '30/30', '34/30', '32/32'));
    expect(labels(result)).toEqual(['30/30', '32/32', '34/30', '36/32']);
  });

  it('place les tailles inconnues numériques à la fin, triées numériquement', () => {
    const result = sortSizes(entries('M', '99', '60', '200'));
    const sorted = labels(result);
    expect(sorted[0]).toBe('M');
    // Les inconnues numériques sont en ordre croissant
    const unknowns = sorted.slice(1);
    expect(unknowns).toEqual(['60', '99', '200']);
  });

  it('place les tailles inconnues alphabétiques à la fin', () => {
    const result = sortSizes(entries('M', 'XXXL', 'A', 'ZZ'));
    const sorted = labels(result);
    expect(sorted[0]).toBe('M');
    const unknowns = sorted.slice(1);
    expect(unknowns).toEqual(['A', 'XXXL', 'ZZ']);
  });

  it('est insensible à la casse pour la correspondance canonique', () => {
    const result = sortSizes(entries('xl', 'xs', 'm', 'l'));
    expect(labels(result)).toEqual(['xs', 'm', 'l', 'xl']);
  });

  it('combine Unique + bébé + lettres + inconnues dans le bon ordre global', () => {
    const result = sortSizes(entries('L', 'Unique', '6 mois', 'XS', 'custom'));
    expect(labels(result)).toEqual(['Unique', '6 mois', 'XS', 'L', 'custom']);
  });

  it('préserve les propriétés supplémentaires (weight, width, etc.)', () => {
    const input: SizeEntry[] = [
      { size: 'L', weight: 300 },
      { size: 'S', weight: 150 },
    ];
    const result = sortSizes(input);
    expect(result[0]).toEqual({ size: 'S', weight: 150 });
    expect(result[1]).toEqual({ size: 'L', weight: 300 });
  });
});
