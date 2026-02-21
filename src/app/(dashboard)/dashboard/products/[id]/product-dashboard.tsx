'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  createVariant,
  updateVariant,
  deleteVariant,
  addVariantImage,
  removeVariantImage,
  updateProduct,
  upsertSku,
} from '../actions';
import { compressImage } from '@/lib/utils/image-compression';
import { PRESET_COLORS } from '@/lib/utils/product-colors';
import { ShippingDimensionsTable } from '@/components/products/shipping-dimensions-table';
import {
  Plus,
  AlertCircle,
  Palette,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';
import type { SkuOutput } from '../actions';
import type { SizeEntry } from '@/lib/utils/parse-sizes';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardVariant {
  id: string;
  name: string;
  color?: string;
  colorCode?: string;
  images: string[];
  priceOverride?: number;
}

interface ProductDashboardProps {
  productId: string;
  initialVariants: DashboardVariant[];
  initialSizes: SizeEntry[];
  initialSkus: SkuOutput[];
  category?: string;
  gender?: string;
}

// ─── Category & Gender → Size group mapping ───────────────────────────────────

function getSuggestedGroupIds(category: string | undefined, gender: string | undefined): string[] {
  // Genre prioritaire : Bébé et Enfant ont leurs propres référentiels
  if (gender === 'Bébé') return ['baby'];
  if (gender === 'Enfant') return ['kids', 'tops-fr'];

  if (!category) return [];

  const cat = category.toLowerCase();

  // Accessoires mode & Bijoux → taille unique
  const accessoryKeywords = [
    'sac', 'ceinture', 'chapeau', 'bonnet', 'écharpe', 'echarpe', 'gants',
    'lunettes', 'montre', 'portefeuille', 'cravate', 'nœud papillon', 'noeud papillon',
    'collier', 'bracelet', 'bague', 'boucles', 'broche', 'pendentif', 'chaîne', 'chaine',
  ];
  if (accessoryKeywords.some((k) => cat.includes(k))) {
    return ['unique'];
  }

  // Chaussures
  const shoesKeywords = [
    'sneakers', 'baskets', 'sandales', 'escarpins', 'bottes', 'bottines',
    'mocassins', 'derbies', 'ballerines', 'chaussures',
  ];
  if (shoesKeywords.some((k) => cat.includes(k))) {
    return ['shoes-eu', 'shoes-us-w', 'shoes-us-m'];
  }

  // Pantalons / Jeans
  if (['pantalon', 'jean', 'chino'].some((k) => cat.includes(k))) {
    return ['pants-eu', 'pants-us', 'pants-wxl'];
  }

  // Bas — shorts, leggings
  if (['short', 'jogger', 'legging', 'bermuda'].some((k) => cat.includes(k))) {
    return ['tops-fr', 'pants-eu', 'pants-us'];
  }

  // Sport & Activewear
  if (['sport', 'activewear', 'maillot'].some((k) => cat.includes(k))) {
    return ['tops-fr', 'pants-eu', 'pants-us'];
  }

  // Tout le reste : Hauts, Pulls, Vestes, Robes, Combinaisons, Tenues traditionnelles, Lingerie
  return ['tops-fr', 'tops-fr-num'];
}

interface SkuCell {
  stock: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SIZE_GROUPS = [
  { id: 'unique', label: 'Taille unique', sizes: ['Unique'] },
  { id: 'baby', label: 'Bébé (âge)', note: '0 à 24 mois', sizes: ['1 mois', '3 mois', '6 mois', '9 mois', '12 mois', '18 mois', '24 mois'] },
  { id: 'kids', label: 'Enfant (âge)', note: '2 à 14 ans', sizes: ['2 ans', '3 ans', '4 ans', '5 ans', '6 ans', '7 ans', '8 ans', '10 ans', '12 ans', '14 ans'] },
  { id: 'tops-fr', label: 'Hauts — FR (lettres)', note: 'XS à 3XL', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] },
  { id: 'tops-fr-num', label: 'Hauts — FR (chiffres)', note: 'Tour de poitrine', sizes: ['34', '36', '38', '40', '42', '44', '46', '48', '50', '52'] },
  { id: 'tops-us', label: 'Hauts — US', note: 'US sizing', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  { id: 'pants-eu', label: 'Pantalons — EU', note: 'Tour de taille cm', sizes: ['36', '38', '40', '42', '44', '46', '48'] },
  { id: 'pants-us', label: 'Pantalons — US', note: 'Waist (pouces)', sizes: ['28', '30', '32', '34', '36', '38', '40'] },
  { id: 'pants-wxl', label: 'Pantalons — Waist×Length', note: 'W×L US', sizes: ['30/30', '30/32', '32/30', '32/32', '34/30', '34/32', '36/30', '36/32'] },
  { id: 'shoes-eu', label: 'Chaussures — EU', note: 'Pointure européenne', sizes: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'] },
  { id: 'shoes-us-w', label: 'Chaussures — US Femme', note: 'US Women', sizes: ['5', '5.5', '6', '6.5', '7', '7.5', '8', '9', '10'] },
  { id: 'shoes-us-m', label: 'Chaussures — US Homme', note: 'US Men', sizes: ['7', '7.5', '8', '8.5', '9', '9.5', '10', '11', '12'] },
];

// ─── Matrix key ───────────────────────────────────────────────────────────────

function skuKey(variantId: string | undefined, size: string | undefined): string {
  return `${variantId ?? '__base__'}::${size ?? '__none__'}`;
}

function buildMatrix(skus: SkuOutput[]): Map<string, SkuCell> {
  const map = new Map<string, SkuCell>();
  for (const s of skus) {
    map.set(skuKey(s.variantId, s.size), { stock: s.stock });
  }
  return map;
}

// ─── VariantImageStrip ────────────────────────────────────────────────────────

interface VariantImageStripProps {
  variantId: string;
  productId: string;
  images: string[];
  onAdd: (url: string) => void;
  onRemove: (url: string) => void;
}

function VariantImageStrip({ variantId, productId, images, onAdd, onRemove }: VariantImageStripProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      try {
        const compressed = await compressImage(file, { maxDimension: 1200, quality: 0.85 });
        const fd = new FormData();
        fd.append('file', compressed.file);
        const result = await addVariantImage(variantId, productId, fd);
        if (result.success && result.url) onAdd(result.url);
      } catch {
        // continue with next file
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {images.slice(0, 4).map((url, i) => (
        <div key={i} className="relative group/img h-10 w-10 rounded border overflow-hidden shrink-0">
          <img src={url} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/50 transition-colors flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                onRemove(url);
                void removeVariantImage(variantId, productId, url);
                router.refresh();
              }}
              className="opacity-0 group-hover/img:opacity-100 text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
      {images.length > 4 && (
        <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center shrink-0 text-[10px] font-medium text-muted-foreground">
          +{images.length - 4}
        </div>
      )}
      <button
        type="button"
        onClick={() => !uploading && fileInputRef.current?.click()}
        disabled={uploading}
        title="Ajouter des photos"
        className={`h-10 rounded border-2 border-dashed border-muted-foreground/25 flex items-center justify-center gap-1 hover:border-muted-foreground/50 hover:bg-muted/20 transition-colors shrink-0 ${images.length === 0 ? 'px-2' : 'w-10'}`}
      >
        {uploading ? (
          <div className="h-3 w-3 rounded-full border border-t-transparent border-muted-foreground/50 animate-spin" />
        ) : (
          <>
            <Plus className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            {images.length === 0 && (
              <span className="text-[11px] text-muted-foreground/50 whitespace-nowrap">Photos</span>
            )}
          </>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFilesChange}
        className="hidden"
      />
    </div>
  );
}

// ─── InlineColorPicker ────────────────────────────────────────────────────────

function InlineColorPicker({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  const pickerRef = useRef<HTMLInputElement>(null);
  return (
    <div className="relative h-5 w-5 shrink-0" title="Cliquer pour changer la couleur">
      <div
        role="button"
        tabIndex={0}
        className="h-full w-full rounded-full border-2 border-white ring-1 ring-border hover:ring-primary/60 transition-all cursor-pointer"
        style={{ backgroundColor: color }}
        onClick={() => pickerRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') pickerRef.current?.click(); }}
      />
      <input
        type="color"
        ref={pickerRef}
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function ProductDashboard({
  productId,
  initialVariants,
  initialSizes,
  initialSkus,
  category,
  gender,
}: ProductDashboardProps) {
  const router = useRouter();
  const [isPendingSkus, startSkuTransition] = useTransition();
  const [isPendingVariant, startVariantTransition] = useTransition();
  const [isPendingSize, startSizeTransition] = useTransition();

  // ── Core state ──────────────────────────────────────────────────────────────
  const [variants, setVariants] = useState<DashboardVariant[]>(initialVariants);
  const [sizes, setSizes] = useState<SizeEntry[]>(initialSizes);
  const [matrix, setMatrix] = useState<Map<string, SkuCell>>(() => buildMatrix(initialSkus));

  // ── UI state ────────────────────────────────────────────────────────────────
  const [shippingOpen, setShippingOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSkus, setSavedSkus] = useState(false);

  // Adding variant (new row)
  const [addingVariant, setAddingVariant] = useState(false);
  const [newVarName, setNewVarName] = useState('');
  const [newVarColorCode, setNewVarColorCode] = useState('#000000');

  // Editing variant inline
  const [editingNameVariantId, setEditingNameVariantId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const newColorPickerRef = useRef<HTMLInputElement>(null);
  // Adding size (new column)
  const [addingSizeOpen, setAddingSizeOpen] = useState(false);
  const [newSizeInput, setNewSizeInput] = useState('');
  const [openSizeGroup, setOpenSizeGroup] = useState<string | null>(() => {
    const ids = getSuggestedGroupIds(category, gender);
    return ids.length === 1 ? (ids[0] ?? null) : null;
  });

  // Sync openSizeGroup quand genre ou catégorie changent en live
  useEffect(() => {
    const ids = getSuggestedGroupIds(category, gender);
    setOpenSizeGroup(ids.length === 1 ? (ids[0] ?? null) : null);
  }, [category, gender]);

  // Auto-save debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveSkusRef = useRef<() => void>(() => {});

  // Auto-hide "Sauvegardé" feedback after 3 seconds
  useEffect(() => {
    if (savedSkus) {
      const timer = setTimeout(() => setSavedSkus(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [savedSkus]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Editing size inline
  const [editingSizeIdx, setEditingSizeIdx] = useState<number | null>(null);
  const [editSizeName, setEditSizeName] = useState('');

  const hasVariants = variants.length > 0;
  const hasSizes = sizes.length > 0;
  const alreadyAddedSizes = new Set(sizes.map((s) => s.size.toLowerCase()));

  // ── Matrix helpers ───────────────────────────────────────────────────────────

  function getCell(variantId: string | undefined, size: string | undefined): SkuCell {
    return matrix.get(skuKey(variantId, size)) ?? { stock: 0 };
  }

  function updateCell(
    variantId: string | undefined,
    size: string | undefined,
    value: string
  ) {
    setSavedSkus(false);
    setMatrix((prev) => {
      const k = skuKey(variantId, size);
      const existing = prev.get(k) ?? { stock: 0 };
      const newMap = new Map(prev);
      newMap.set(k, {
        ...existing,
        stock: Math.max(0, Number.parseInt(value) || 0),
      });
      return newMap;
    });
    // Auto-save after 1.5s of inactivity
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveSkusRef.current();
    }, 1500);
  }

  // ── Save stocks ──────────────────────────────────────────────────────────────

  function buildAllCells(): Array<{ variantId?: string; size?: string; stock: number }> {
    if (!hasVariants && !hasSizes) {
      return [{ ...getCell(undefined, undefined) }];
    }
    if (!hasVariants) {
      return sizes.map(({ size }) => ({ size, ...getCell(undefined, size) }));
    }
    if (!hasSizes) {
      return variants.map((v) => ({ variantId: v.id, ...getCell(v.id, undefined) }));
    }
    const result: Array<{ variantId: string; size: string; stock: number }> = [];
    for (const v of variants) {
      for (const { size } of sizes) {
        result.push({ variantId: v.id, size, ...getCell(v.id, size) });
      }
    }
    return result;
  }

  function handleSaveSkus() {
    setError(null);
    setSavedSkus(false);
    startSkuTransition(async () => {
      const cells = buildAllCells();
      const results = await Promise.all(
        cells.map((cell) =>
          upsertSku({
            productId,
            variantId: cell.variantId,
            size: cell.size,
            stock: cell.stock,
          })
        )
      );
      const failed = results.find((r) => !r.success);
      if (failed) {
        setError(failed.error ?? 'Erreur lors de la sauvegarde');
      } else {
        setSavedSkus(true);
        router.refresh();
      }
    });
  }

  // Keep saveSkusRef up-to-date with latest closure (avoids stale state in debounce)
  saveSkusRef.current = handleSaveSkus;

  // ── Size management ──────────────────────────────────────────────────────────

  function addSize(name: string) {
    const trimmed = name.trim();
    if (!trimmed || sizes.some((s) => s.size.toLowerCase() === trimmed.toLowerCase())) return;
    const newSizes = [...sizes, { size: trimmed }];
    setSizes(newSizes);
    setNewSizeInput('');
    startSizeTransition(async () => {
      await updateProduct(productId, { sizes: newSizes });
      router.refresh();
    });
  }

  function removeSize(idx: number) {
    const newSizes = sizes.filter((_, i) => i !== idx);
    setSizes(newSizes);
    startSizeTransition(async () => {
      await updateProduct(productId, { sizes: newSizes });
      router.refresh();
    });
  }

  function commitEditSize() {
    if (editingSizeIdx === null) return;
    const trimmed = editSizeName.trim();
    if (!trimmed) {
      setEditingSizeIdx(null);
      return;
    }
    const newSizes = sizes.map((s, i) => (i === editingSizeIdx ? { ...s, size: trimmed } : s));
    setSizes(newSizes);
    setEditingSizeIdx(null);
    startSizeTransition(async () => {
      await updateProduct(productId, { sizes: newSizes });
      router.refresh();
    });
  }

  function updateShippingDimension(idx: number, field: keyof SizeEntry, value: string) {
    setSizes((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value ? Number(value) : undefined } : s))
    );
  }

  function saveShippingDimensions() {
    setError(null);
    startSizeTransition(async () => {
      const result = await updateProduct(productId, { sizes });
      if (!result.success) {
        setError(result.error ?? 'Erreur lors de la sauvegarde');
      } else {
        router.refresh();
      }
    });
  }

  // ── Variant management ───────────────────────────────────────────────────────

  function handleAddVariant() {
    if (!newVarName.trim()) return;
    setError(null);

    // Capture base stocks before adding the first variant so we can migrate them
    const isFirstVariant = variants.length === 0;
    const baseStocksToMigrate: Array<{ size?: string; stock: number }> = [];
    if (isFirstVariant) {
      if (!hasSizes) {
        const stock = getCell(undefined, undefined).stock;
        if (stock > 0) baseStocksToMigrate.push({ stock });
      } else {
        for (const { size } of sizes) {
          const stock = getCell(undefined, size).stock;
          if (stock > 0) baseStocksToMigrate.push({ size, stock });
        }
      }
    }

    startVariantTransition(async () => {
      const result = await createVariant({
        productId,
        name: newVarName.trim(),
        color: newVarName.trim() || undefined,
        colorCode: newVarColorCode || undefined,
        stock: 0,
      });
      if (!result.success) {
        setError(result.error ?? 'Erreur lors de la création');
      } else {
        const newVariantId = result.id!;

        // Migrate base stock to the new variant when it's the first one added
        if (isFirstVariant && baseStocksToMigrate.length > 0) {
          await Promise.all(
            baseStocksToMigrate.map(({ size, stock }) =>
              upsertSku({ productId, variantId: newVariantId, size, stock })
            )
          );
          setMatrix((prev) => {
            const newMap = new Map(prev);
            for (const { size, stock } of baseStocksToMigrate) {
              newMap.set(skuKey(newVariantId, size), { stock });
            }
            return newMap;
          });
        }

        const newVariant: DashboardVariant = {
          id: newVariantId,
          name: newVarName.trim(),
          color: newVarName.trim() || undefined,
          colorCode: newVarColorCode || undefined,
          images: [],
        };
        setVariants((prev) => [...prev, newVariant]);
        setAddingVariant(false);
        setNewVarName('');
        setNewVarColorCode('#000000');
        router.refresh();
      }
    });
  }

  function handleDeleteVariant(variantId: string) {
    setError(null);
    startVariantTransition(async () => {
      const result = await deleteVariant(variantId, productId);
      if (!result.success) {
        setError(result.error ?? 'Erreur');
      } else {
        setVariants((prev) => prev.filter((v) => v.id !== variantId));
        router.refresh();
      }
    });
  }

  function handleQuickColorChange(variantId: string, newColorCode: string) {
    setVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, colorCode: newColorCode } : v))
    );
    startVariantTransition(async () => {
      await updateVariant(variantId, productId, { colorCode: newColorCode });
      router.refresh();
    });
  }

  function commitNameEdit(variantId: string) {
    const trimmed = editingNameValue.trim();
    setEditingNameVariantId(null);
    if (!trimmed) return;
    setVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, name: trimmed, color: trimmed } : v))
    );
    startVariantTransition(async () => {
      await updateVariant(variantId, productId, { name: trimmed, color: trimmed });
      router.refresh();
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const hasShippingData = sizes.some(
    (s) =>
      (s.weight && s.weight > 0) ||
      (s.width && s.width > 0) ||
      (s.height && s.height > 0) ||
      (s.length && s.length > 0)
  );

  // colspan = 1 (couleur) + nb tailles ou 1 (globale) + 1 (add taille + trash fusionnés)
  const colSpanTotal = 1 + (hasSizes ? sizes.length : 1) + 1;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Palette className="h-5 w-5" />
          Couleurs &amp; Stock
          {(variants.length > 0 || sizes.length > 0) && (
            <span className="text-sm font-normal text-muted-foreground">
              {variants.length > 0 && `${variants.length} couleur${variants.length > 1 ? 's' : ''}`}
              {variants.length > 0 && sizes.length > 0 && ' · '}
              {sizes.length > 0 && `${sizes.length} taille${sizes.length > 1 ? 's' : ''}`}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex gap-2">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* ── Matrix table: Colonnes = Tailles, Lignes = Couleurs ──────── */}
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full border-separate" style={{ borderSpacing: '4px' }}>
            <thead>
              <tr>
                {/* Coin supérieur gauche */}
                <th className="min-w-[260px] pb-2 text-left">
                  <span className="text-xs text-muted-foreground font-normal">Couleur \ Taille</span>
                </th>

                {/* Colonnes tailles */}
                {hasSizes && sizes.map(({ size }, idx) => (
                  <th key={size} className="min-w-[80px] pb-2 text-center">
                    <div className="flex flex-col items-center gap-1 group/sizecol">
                      <div className="flex items-center gap-1">
                        {editingSizeIdx === idx ? (
                          <Input
                            autoFocus
                            value={editSizeName}
                            onChange={(e) => setEditSizeName(e.target.value)}
                            onBlur={commitEditSize}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitEditSize();
                              if (e.key === 'Escape') setEditingSizeIdx(null);
                            }}
                            className="h-7 w-14 text-sm text-center font-semibold"
                          />
                        ) : (
                          <span
                            className="inline-flex items-center justify-center rounded-full border bg-muted/50 px-2.5 py-1 text-sm font-semibold cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => {
                              setEditingSizeIdx(idx);
                              setEditSizeName(size);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setEditingSizeIdx(idx); setEditSizeName(size); } }}
                          >
                            {size}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeSize(idx)}
                          disabled={isPendingSize}
                          className="opacity-0 group-hover/sizecol:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </th>
                ))}

                {/* Colonne globale si pas de taille */}
                {!hasSizes && (
                  <th className="min-w-[80px] pb-2 text-center">
                    <span className="text-xs text-muted-foreground">—</span>
                  </th>
                )}

                {/* Colonne + Taille */}
                <th className="min-w-[100px] pb-2 align-bottom">
                  <button
                    type="button"
                    onClick={() => setAddingSizeOpen(true)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border-2 border-dashed rounded-lg px-2 py-1.5 hover:border-muted-foreground/50 transition-colors w-full justify-center"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Taille
                  </button>
                </th>
              </tr>
            </thead>

            <tbody>
              {/* Lignes variantes */}
              {variants.map((v) => (
                <tr key={v.id}>
                  <td className="py-0.5 min-w-[260px]">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <VariantImageStrip
                        variantId={v.id}
                        productId={productId}
                        images={v.images}
                        onAdd={(url) =>
                          setVariants((prev) =>
                            prev.map((x) =>
                              x.id === v.id ? { ...x, images: [...x.images, url] } : x
                            )
                          )
                        }
                        onRemove={(url) =>
                          setVariants((prev) =>
                            prev.map((x) =>
                              x.id === v.id ? { ...x, images: x.images.filter((u) => u !== url) } : x
                            )
                          )
                        }
                      />
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {v.colorCode ? (
                          <InlineColorPicker
                            color={v.colorCode}
                            onChange={(c) => handleQuickColorChange(v.id, c)}
                          />
                        ) : null}
                        {editingNameVariantId === v.id ? (
                          <input
                            autoFocus
                            value={editingNameValue}
                            onChange={(e) => setEditingNameValue(e.target.value)}
                            onBlur={() => commitNameEdit(v.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitNameEdit(v.id);
                              if (e.key === 'Escape') setEditingNameVariantId(null);
                            }}
                            className="font-medium text-sm border-b-2 border-primary bg-transparent outline-none w-full min-w-0"
                          />
                        ) : (
                          <span
                            className="font-medium text-sm truncate cursor-text select-none border-b-2 border-transparent"
                            onClick={() => {
                              setEditingNameVariantId(v.id);
                              setEditingNameValue(v.name);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setEditingNameVariantId(v.id); setEditingNameValue(v.name); } }}
                            title="Cliquer pour modifier le nom"
                          >
                            {v.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Cellules stock */}
                  {hasSizes ? (
                    sizes.map(({ size }) => {
                      const cell = getCell(v.id, size);
                      return (
                        <td key={size} className="p-0">
                          <Input
                            type="number"
                            min="0"
                            value={cell.stock === 0 ? '' : cell.stock}
                            onChange={(e) => updateCell(v.id, size, e.target.value)}
                            placeholder="0"
                            className={`h-11 text-center text-base font-semibold transition-colors ${cell.stock === 0 ? 'border-dashed bg-muted/20 text-muted-foreground/60' : 'bg-background'}`}
                            aria-label={`Stock ${v.name} taille ${size}`}
                          />
                        </td>
                      );
                    })
                  ) : (
                    <td className="p-0">
                      {(() => {
                        const cell = getCell(v.id, undefined);
                        return (
                          <Input
                            type="number"
                            min="0"
                            value={cell.stock === 0 ? '' : cell.stock}
                            onChange={(e) => updateCell(v.id, undefined, e.target.value)}
                            placeholder="0"
                            className={`h-11 text-center text-base font-semibold transition-colors ${cell.stock === 0 ? 'border-dashed bg-muted/20 text-muted-foreground/60' : 'bg-background'}`}
                            aria-label={`Stock ${v.name}`}
                          />
                        );
                      })()}
                    </td>
                  )}
                  <td className="p-0 pl-1 align-middle min-w-[100px]">
                    <button
                      type="button"
                      onClick={() => handleDeleteVariant(v.id)}
                      disabled={isPendingVariant}
                      title="Supprimer cette couleur"
                      className="flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg w-full h-11 text-muted-foreground/40 hover:text-destructive hover:border-destructive/50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Ligne "+ Ajouter couleur" */}
              <tr>
                <td colSpan={colSpanTotal} className="pt-2">
                  <button
                    type="button"
                    onClick={() => setAddingVariant(true)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border-2 border-dashed rounded-lg px-3 py-2 hover:border-muted-foreground/50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter une couleur
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Modal: Ajouter une taille ──────────────────────────────────── */}
        {addingSizeOpen && (
          <div
            role="button"
            tabIndex={0}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={() => { setAddingSizeOpen(false); setNewSizeInput(''); }}
            onKeyDown={(e) => { if (e.key === 'Escape') { setAddingSizeOpen(false); setNewSizeInput(''); } }}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="bg-background border rounded-xl p-5 w-[480px] max-h-[80vh] overflow-y-auto shadow-xl space-y-3"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-medium">Ajouter une taille</p>

              {(() => {
                const suggestedIds = getSuggestedGroupIds(category, gender);
                const suggestedGroups = SIZE_GROUPS.filter((g) => suggestedIds.includes(g.id));
                const otherGroups = SIZE_GROUPS.filter((g) => !suggestedIds.includes(g.id));
                const hasSuggestions = suggestedGroups.length > 0;

                function renderGroup(group: (typeof SIZE_GROUPS)[number]) {
                  return (
                    <div key={group.id} className="border rounded-md overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setOpenSizeGroup((prev) => (prev === group.id ? null : group.id))}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <span className="font-medium">{group.label}</span>
                          {'note' in group && group.note && (
                            <span className="text-xs text-muted-foreground ml-2">{group.note}</span>
                          )}
                        </div>
                        {openSizeGroup === group.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      {openSizeGroup === group.id && (
                        <div className="px-3 pb-3 flex flex-wrap gap-1.5 border-t pt-2">
                          {group.sizes.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => { addSize(s); setAddingSizeOpen(false); }}
                              disabled={alreadyAddedSizes.has(s.toLowerCase())}
                              className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                if (!hasSuggestions) {
                  return (
                    <>
                      <p className="text-xs font-medium text-muted-foreground">Choisir un référentiel de tailles</p>
                      {SIZE_GROUPS.map(renderGroup)}
                    </>
                  );
                }

                return (
                  <>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        Référentiels suggérés
                        {(gender === 'Bébé' || gender === 'Enfant') ? (
                          <span className="ml-1 text-muted-foreground/60">pour {gender}</span>
                        ) : category ? (
                          <span className="ml-1 text-muted-foreground/60">pour {category}</span>
                        ) : null}
                      </p>
                      {suggestedGroups.map(renderGroup)}
                    </div>

                    {otherGroups.length > 0 && (
                      <details className="group/others">
                        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground py-1 list-none flex items-center gap-1 select-none">
                          <ChevronDown className="h-3.5 w-3.5 group-open/others:rotate-180 transition-transform" />
                          Autres référentiels
                        </summary>
                        <div className="space-y-1.5 mt-1.5">
                          {otherGroups.map(renderGroup)}
                        </div>
                      </details>
                    )}
                  </>
                );
              })()}

              {/* Taille personnalisée */}
              <div className="flex gap-2 pt-1">
                <Input
                  autoFocus
                  value={newSizeInput}
                  onChange={(e) => setNewSizeInput(e.target.value)}
                  placeholder="Taille personnalisée (ex: 42-44, L/XL)..."
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newSizeInput.trim()) {
                      addSize(newSizeInput);
                      setAddingSizeOpen(false);
                    }
                    if (e.key === 'Escape') { setAddingSizeOpen(false); setNewSizeInput(''); }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (newSizeInput.trim()) {
                      addSize(newSizeInput);
                      setAddingSizeOpen(false);
                    }
                  }}
                  disabled={!newSizeInput.trim()}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setAddingSizeOpen(false); setNewSizeInput(''); }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Shipping dimensions ────────────────────────────────────────── */}
        {hasSizes && (
          <div className="border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShippingOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-expanded={shippingOpen}
            >
              <span>Paramètres d&apos;expédition</span>
              <span className="flex items-center gap-1.5">
                {hasShippingData && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label="Données renseignées" />
                )}
                {shippingOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </span>
            </button>
            {shippingOpen && (
              <div className="border-t px-4 py-4 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Ces informations sont utilisées pour calculer les frais d&apos;envoi.
                </p>
                <ShippingDimensionsTable
                  sizes={sizes}
                  onChange={(idx, field, value) => updateShippingDimension(idx, field, value)}
                  onBlur={saveShippingDimensions}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Modal: Ajouter une couleur ─────────────────────────────────── */}
        {addingVariant && (
          <div
            role="button"
            tabIndex={0}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={() => { setAddingVariant(false); setNewVarName(''); setNewVarColorCode('#000000'); }}
            onKeyDown={(e) => { if (e.key === 'Escape') { setAddingVariant(false); setNewVarName(''); setNewVarColorCode('#000000'); } }}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="bg-background border rounded-xl p-5 w-80 shadow-xl space-y-4"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-medium">Nouvelle couleur</p>

              {/* Circle picker + nom */}
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 cursor-pointer" title="Choisir une couleur">
                  <div
                    role="button"
                    tabIndex={0}
                    className="h-full w-full rounded-full border-2 border-white ring-2 ring-border hover:ring-primary/60 transition-all"
                    style={{ backgroundColor: newVarColorCode }}
                    onClick={() => newColorPickerRef.current?.click()}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') newColorPickerRef.current?.click(); }}
                  />
                  <input
                    type="color"
                    ref={newColorPickerRef}
                    value={newVarColorCode}
                    onChange={(e) => {
                      setNewVarColorCode(e.target.value);
                      const preset = PRESET_COLORS.find(
                        (c) => c.hex.toLowerCase() === e.target.value.toLowerCase()
                      );
                      if (preset && (!newVarName || PRESET_COLORS.some(p => p.name === newVarName))) setNewVarName(preset.name);
                    }}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    aria-hidden="true"
                    tabIndex={-1}
                  />
                </div>
                <Input
                  autoFocus
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                  placeholder="Nom de la couleur"
                  className="h-9 flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddVariant();
                    if (e.key === 'Escape') { setAddingVariant(false); setNewVarName(''); setNewVarColorCode('#000000'); }
                  }}
                />
              </div>

              {/* Preset colors */}
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() => { setNewVarColorCode(c.hex); if (!newVarName || PRESET_COLORS.some(p => p.name === newVarName)) setNewVarName(c.name); }}
                    className={`h-6 w-6 rounded-full border-2 hover:scale-110 transition-transform ${newVarColorCode.toLowerCase() === c.hex.toLowerCase() ? 'border-primary ring-1 ring-primary/60 scale-110' : 'border-white ring-1 ring-border/60'}`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>

              {/* Boutons */}
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddVariant}
                  disabled={isPendingVariant || !newVarName.trim()}
                  className="flex-1 gap-1"
                >
                  <Check className="h-3.5 w-3.5" /> Valider
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setAddingVariant(false); setNewVarName(''); setNewVarColorCode('#000000'); }}
                  className="flex-1 gap-1"
                >
                  <X className="h-3.5 w-3.5" /> Annuler
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer: auto-save status ───────────────────────────────────── */}
        <div className="flex items-center justify-end pt-3 border-t gap-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground transition-opacity">
            {isPendingSkus && (
              <>
                <div className="h-3 w-3 rounded-full border border-t-transparent border-muted-foreground/50 animate-spin" />
                Sauvegarde…
              </>
            )}
            {!isPendingSkus && savedSkus && (
              <>
                <Check className="h-3 w-3 text-green-500" />
                <span className="text-green-600 dark:text-green-400">Sauvegardé</span>
              </>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
