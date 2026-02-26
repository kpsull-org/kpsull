export type FilterParams = {
  style?: string;
  minPrice?: string;
  maxPrice?: string;
  size?: string;
  sort?: string;
  gender?: string;
};

export const GENDER_OPTIONS = [
  { value: "Homme", label: "Homme" },
  { value: "Femme", label: "Femme" },
  { value: "Unisexe", label: "Unisexe" },
  { value: "Enfant", label: "Enfant" },
  { value: "Bébé", label: "Bébé" },
] as const;

export const SORT_OPTIONS = [
  { value: "newest", label: "Nouveautés" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
] as const;

export const PRICE_MIN = 0;

export const safeParseInt = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
};
