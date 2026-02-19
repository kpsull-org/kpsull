export interface SizeEntry {
  size: string;
  weight?: number;
  width?: number;
  height?: number;
  length?: number;
}

/** Parse le champ JSON `sizes` de Prisma en tableau typé */
export function parseSizes(json: unknown): SizeEntry[] {
  if (!Array.isArray(json)) return [];
  return json.filter(
    (item): item is SizeEntry =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Record<string, unknown>).size === 'string'
  );
}
