"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { PriceRangeInput } from "@/components/ui/slider";

type FilterCategory = "sort" | "style" | "gender" | "size" | "price";

interface MobileFilterBarProps {
  styles: { id: string; name: string }[];
  sizes: string[];
  priceMax: number;
  currentParams: {
    style?: string;
    minPrice?: string;
    maxPrice?: string;
    size?: string;
    sort?: string;
    gender?: string;
  };
}

const GENDER_OPTIONS = [
  { value: "Homme", label: "Homme" },
  { value: "Femme", label: "Femme" },
  { value: "Unisexe", label: "Unisexe" },
  { value: "Enfant", label: "Enfant" },
  { value: "Bébé", label: "Bébé" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Nouveautés" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
];

const PRICE_MIN = 0;

const safeParseInt = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
};

interface FilterChipProps {
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
}

function FilterChip({ label, count, isActive, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 border transition-colors ${
        isActive
          ? "bg-black text-white border-black"
          : "bg-white text-black/55 border-black/20 hover:border-black/50 hover:text-black/80"
      }`}
    >
      <span className="text-[10px] uppercase tracking-[0.1em] font-semibold whitespace-nowrap">
        {label}
        {count !== undefined && count > 0 ? ` (${count})` : ""}
      </span>
      <ChevronDown className="w-2.5 h-2.5 opacity-50 flex-shrink-0" />
    </button>
  );
}

interface SheetHeaderRowProps {
  title: string;
  onClose: () => void;
}

function SheetHeaderRow({ title, onClose }: SheetHeaderRowProps) {
  return (
    <div className="px-5 py-4 border-b border-black/10 flex items-center justify-between">
      <SheetTitle className="text-[9px] uppercase tracking-[0.2em] font-bold text-black">
        {title}
      </SheetTitle>
      <button
        onClick={onClose}
        className="p-1 -mr-1 text-black/40 hover:text-black transition-colors"
        aria-label="Fermer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function MobileFilterBar({
  styles,
  sizes,
  priceMax,
  currentParams,
}: Readonly<MobileFilterBarProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const [openSheet, setOpenSheet] = useState<FilterCategory | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    safeParseInt(currentParams.minPrice, PRICE_MIN),
    safeParseInt(currentParams.maxPrice, priceMax),
  ]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPriceRange([
      safeParseInt(currentParams.minPrice, PRICE_MIN),
      safeParseInt(currentParams.maxPrice, priceMax),
    ]);
  }, [currentParams.minPrice, currentParams.maxPrice, priceMax]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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
        if (val !== undefined && val !== "") params.set(key, val);
      });
      router.push(`${pathname}?${params.toString()}`);
    },
    [currentParams, pathname, router]
  );

  const selectedStyles = currentParams.style?.split(",").filter(Boolean) ?? [];
  const selectedSizes = currentParams.size?.split(",").filter(Boolean) ?? [];
  const selectedGenders = currentParams.gender?.split(",").filter(Boolean) ?? [];
  const currentSort = currentParams.sort ?? "newest";

  const handleStyleToggle = (name: string) => {
    const updated = selectedStyles.includes(name)
      ? selectedStyles.filter((s) => s !== name)
      : [...selectedStyles, name];
    updateParams({ style: updated.length > 0 ? updated.join(",") : undefined });
  };

  const handleSizeToggle = (size: string) => {
    const updated = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    updateParams({ size: updated.length > 0 ? updated.join(",") : undefined });
  };

  const handleGenderToggle = (gender: string) => {
    const updated = selectedGenders.includes(gender)
      ? selectedGenders.filter((g) => g !== gender)
      : [...selectedGenders, gender];
    updateParams({ gender: updated.length > 0 ? updated.join(",") : undefined });
  };

  const handleSortSelect = (value: string) => {
    updateParams({ sort: value === "newest" ? undefined : value });
    setOpenSheet(null);
  };

  const handlePriceChange = (val: [number, number]) => {
    setPriceRange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({
        minPrice: val[0] === PRICE_MIN ? undefined : String(val[0]),
        maxPrice: val[1] === priceMax ? undefined : String(val[1]),
      });
    }, 500);
  };

  const hasPriceFilter =
    safeParseInt(currentParams.minPrice, PRICE_MIN) !== PRICE_MIN ||
    safeParseInt(currentParams.maxPrice, priceMax) !== priceMax;

  const hasActiveFilters =
    selectedStyles.length > 0 ||
    selectedSizes.length > 0 ||
    selectedGenders.length > 0 ||
    hasPriceFilter;

  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === currentSort)?.label ?? "Nouveautés";

  const closeSheet = () => setOpenSheet(null);

  return (
    <div className="md:hidden border-b border-black font-[family-name:var(--font-montserrat)]">
      {/* ── Chips bar ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterChip
          label={sortLabel}
          isActive={currentSort !== "newest"}
          onClick={() => setOpenSheet("sort")}
        />
        {styles.length > 0 && (
          <FilterChip
            label="Style"
            count={selectedStyles.length}
            isActive={selectedStyles.length > 0}
            onClick={() => setOpenSheet("style")}
          />
        )}
        <FilterChip
          label="Genre"
          count={selectedGenders.length}
          isActive={selectedGenders.length > 0}
          onClick={() => setOpenSheet("gender")}
        />
        {sizes.length > 0 && (
          <FilterChip
            label="Taille"
            count={selectedSizes.length}
            isActive={selectedSizes.length > 0}
            onClick={() => setOpenSheet("size")}
          />
        )}
        <FilterChip
          label="Prix"
          isActive={hasPriceFilter}
          onClick={() => setOpenSheet("price")}
        />
        {hasActiveFilters && (
          <button
            onClick={() => {
              router.push(pathname);
              setPriceRange([PRICE_MIN, priceMax]);
            }}
            className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.12em] text-black/35 hover:text-black/70 transition-colors"
          >
            <X className="w-2.5 h-2.5" />
            Effacer
          </button>
        )}
      </div>

      {/* ── Sort sheet ── */}
      <Sheet open={openSheet === "sort"} onOpenChange={(o) => !o && closeSheet()}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="px-0 rounded-t-none border-t border-black"
        >
          <SheetHeaderRow title="Trier par" onClose={closeSheet} />
          <div className="px-5 py-2 pb-8">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSortSelect(opt.value)}
                className={`w-full text-left py-3.5 border-b border-black/5 last:border-0 flex items-center justify-between transition-colors ${
                  currentSort === opt.value
                    ? "text-black"
                    : "text-black/40 hover:text-black/70"
                }`}
              >
                <span className="text-[11px] uppercase tracking-[0.1em] font-medium">
                  {opt.label}
                </span>
                {currentSort === opt.value && (
                  <div className="w-1.5 h-1.5 rounded-full bg-black" />
                )}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Style sheet ── */}
      {styles.length > 0 && (
        <Sheet open={openSheet === "style"} onOpenChange={(o) => !o && closeSheet()}>
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="px-0 rounded-t-none border-t border-black"
          >
            <SheetHeaderRow title="Style" onClose={closeSheet} />
            <div className="px-5 py-2 pb-8 max-h-[55vh] overflow-y-auto">
              {styles.map((style) => {
                const isActive = selectedStyles.includes(style.name);
                return (
                  <button
                    key={style.id}
                    onClick={() => handleStyleToggle(style.name)}
                    className={`w-full text-left py-3.5 border-b border-black/5 last:border-0 flex items-center justify-between transition-colors ${
                      isActive
                        ? "text-black"
                        : "text-black/40 hover:text-black/70"
                    }`}
                  >
                    <span className="text-[11px] uppercase tracking-[0.1em] font-medium">
                      {style.name}
                    </span>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-black" />
                    )}
                  </button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* ── Genre sheet ── */}
      <Sheet open={openSheet === "gender"} onOpenChange={(o) => !o && closeSheet()}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="px-0 rounded-t-none border-t border-black"
        >
          <SheetHeaderRow title="Genre" onClose={closeSheet} />
          <div className="px-5 py-4 pb-8">
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((opt) => {
                const isActive = selectedGenders.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleGenderToggle(opt.value)}
                    className={`px-4 py-2.5 text-[11px] uppercase tracking-[0.08em] font-medium border transition-colors ${
                      isActive
                        ? "bg-black text-white border-black"
                        : "bg-white text-black/50 border-black/25 hover:border-black hover:text-black"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Size sheet ── */}
      {sizes.length > 0 && (
        <Sheet open={openSheet === "size"} onOpenChange={(o) => !o && closeSheet()}>
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="px-0 rounded-t-none border-t border-black"
          >
            <SheetHeaderRow title="Taille" onClose={closeSheet} />
            <div className="px-5 py-4 pb-8 max-h-[50vh] overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const isActive = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      onClick={() => handleSizeToggle(size)}
                      className={`px-3.5 py-2 text-[11px] uppercase tracking-[0.08em] font-medium border transition-colors ${
                        isActive
                          ? "bg-black text-white border-black"
                          : "bg-white text-black/50 border-black/25 hover:border-black hover:text-black"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* ── Prix sheet ── */}
      <Sheet open={openSheet === "price"} onOpenChange={(o) => !o && closeSheet()}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="px-0 rounded-t-none border-t border-black"
        >
          <SheetHeaderRow title="Prix" onClose={closeSheet} />
          <div className="px-5 pt-4 pb-10">
            <PriceRangeInput
              min={PRICE_MIN}
              max={priceMax}
              value={priceRange}
              onValueChange={handlePriceChange}
            />
            <div className="flex items-center justify-between mt-4 text-[11px] text-black/40">
              <span>{priceRange[0]}€</span>
              <span>{priceRange[1]}€</span>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
