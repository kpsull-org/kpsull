"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PriceRangeInput } from "@/components/ui/slider";
import {
  type FilterParams,
  GENDER_OPTIONS,
  SORT_OPTIONS,
  PRICE_MIN,
  safeParseInt,
} from "./filter-shared";

interface FilterSidebarProps {
  styles: { id: string; name: string }[];
  sizes: string[];
  priceMax: number;
  currentParams: FilterParams;
}

export function FilterSidebar({
  styles,
  sizes,
  priceMax,
  currentParams,
}: Readonly<FilterSidebarProps>) {
  const router = useRouter();
  const pathname = usePathname();

  const [priceRange, setPriceRange] = useState<[number, number]>([
    safeParseInt(currentParams.minPrice, PRICE_MIN),
    safeParseInt(currentParams.maxPrice, priceMax),
  ]);

  useEffect(() => {
    setPriceRange([
      safeParseInt(currentParams.minPrice, PRICE_MIN),
      safeParseInt(currentParams.maxPrice, priceMax),
    ]);
  }, [currentParams.minPrice, currentParams.maxPrice, priceMax]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams();

      const merged = {
        style: currentParams.style,
        minPrice: currentParams.minPrice,
        maxPrice: currentParams.maxPrice,
        size: currentParams.size,
        sort: currentParams.sort,
        gender: currentParams.gender,
        ...updates,
      };

      Object.entries(merged).forEach(([key, val]) => {
        if (val !== undefined && val !== "") {
          params.set(key, val);
        }
      });

      router.push(`${pathname}?${params.toString()}`);
    },
    [currentParams, pathname, router]
  );

  const selectedStyles = currentParams.style
    ? currentParams.style.split(",").filter(Boolean)
    : [];

  const handleStyleToggle = (styleName: string) => {
    const isActive = selectedStyles.includes(styleName);
    const updated = isActive
      ? selectedStyles.filter((s) => s !== styleName)
      : [...selectedStyles, styleName];
    updateParams({ style: updated.length > 0 ? updated.join(",") : undefined });
  };

  const selectedSizes = currentParams.size
    ? currentParams.size.split(",").filter(Boolean)
    : [];

  const handleSizeToggle = (size: string) => {
    const isActive = selectedSizes.includes(size);
    const updated = isActive
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    updateParams({ size: updated.length > 0 ? updated.join(",") : undefined });
  };

  const selectedGenders = currentParams.gender
    ? currentParams.gender.split(",").filter(Boolean)
    : [];

  const handleGenderToggle = (gender: string) => {
    const isActive = selectedGenders.includes(gender);
    const updated = isActive
      ? selectedGenders.filter((g) => g !== gender)
      : [...selectedGenders, gender];
    updateParams({ gender: updated.length > 0 ? updated.join(",") : undefined });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateParams({ sort: e.target.value || undefined });
  };

  const handlePriceChange = (val: [number, number]) => {
    setPriceRange(val);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      updateParams({
        minPrice: val[0] === PRICE_MIN ? undefined : String(val[0]),
        maxPrice: val[1] === priceMax ? undefined : String(val[1]),
      });
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const hasActiveFilters =
    !!currentParams.style ||
    !!currentParams.size ||
    !!currentParams.gender ||
    (currentParams.minPrice !== undefined &&
      safeParseInt(currentParams.minPrice, PRICE_MIN) !== PRICE_MIN) ||
    (currentParams.maxPrice !== undefined &&
      safeParseInt(currentParams.maxPrice, priceMax) !== priceMax);

  const clearFilters = () => {
    router.push(pathname);
    setPriceRange([PRICE_MIN, priceMax]);
  };

  return (
    <div className="space-y-6 font-[family-name:var(--font-montserrat)]">
      {/* Sort */}
      <div className="space-y-2.5">
        <p className="text-[9px] uppercase tracking-[0.2em] text-black/50 font-bold">
          Trier par
        </p>
        <select
          value={currentParams.sort ?? "newest"}
          onChange={handleSortChange}
          className="w-full text-[10px] uppercase tracking-[0.1em] bg-transparent border-0 focus:outline-none text-black/70 cursor-pointer appearance-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <hr className="border-black/10" />

      {/* Style */}
      {styles.length > 0 && (
        <>
          <div className="space-y-2.5">
            <p className="text-[9px] uppercase tracking-[0.2em] text-black/50 font-bold">
              Style
            </p>
            <div className="space-y-2">
              {styles.map((style) => {
                const isActive = selectedStyles.includes(style.name);
                return (
                  <button
                    key={style.id}
                    onClick={() => handleStyleToggle(style.name)}
                    className={`block w-full text-left text-[11px] uppercase tracking-wide transition-colors ${
                      isActive
                        ? "text-black font-semibold"
                        : "text-black/40 hover:text-black/70"
                    }`}
                  >
                    {style.name}
                  </button>
                );
              })}
            </div>
          </div>
          <hr className="border-black/10" />
        </>
      )}

      {/* Gender */}
      <div className="space-y-2.5">
        <p className="text-[9px] uppercase tracking-[0.2em] text-black/50 font-bold">
          Genre
        </p>
        <div className="flex flex-wrap gap-1.5">
          {GENDER_OPTIONS.map((opt) => {
            const isActive = selectedGenders.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => handleGenderToggle(opt.value)}
                className={`px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] border transition-colors ${
                  isActive
                    ? "bg-black text-white border-black"
                    : "bg-transparent text-black/50 border-black hover:text-black"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-black/10" />

      {/* Size */}
      {sizes.length > 0 && (
        <>
          <div className="space-y-2.5">
            <p className="text-[9px] uppercase tracking-[0.2em] text-black/50 font-bold">
              Taille
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sizes.map((size) => {
                const isActive = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    onClick={() => handleSizeToggle(size)}
                    className={`px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] border transition-colors ${
                      isActive
                        ? "bg-black text-white border-black"
                        : "bg-transparent text-black/50 border-black hover:text-black"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
          <hr className="border-black/10" />
        </>
      )}

      {/* Price */}
      <div className="space-y-3">
        <p className="text-[9px] uppercase tracking-[0.2em] text-black/50 font-bold">
          Prix
        </p>
        <PriceRangeInput
          min={PRICE_MIN}
          max={priceMax}
          value={priceRange}
          onValueChange={handlePriceChange}
        />
        <div className="flex items-center justify-between text-[10px] text-black/40">
          <span>{priceRange[0]}€</span>
          <span>{priceRange[1]}€</span>
        </div>
      </div>

      {hasActiveFilters && (
        <>
          <hr className="border-black/10" />
          <button
            onClick={clearFilters}
            className="text-[10px] uppercase tracking-[0.12em] text-black/40 hover:text-black transition-colors"
          >
            Effacer les filtres
          </button>
        </>
      )}
    </div>
  );
}
