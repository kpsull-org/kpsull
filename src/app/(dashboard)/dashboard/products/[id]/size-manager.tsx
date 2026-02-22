'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { updateProduct } from '../actions';
import { ShippingDimensionsTable } from '@/components/products/shipping-dimensions-table';
import { Plus, Save, Ruler, AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { SizeEntry } from '@/lib/utils/parse-sizes';

export type { SizeEntry };

interface SizeManagerProps {
  readonly productId: string;
  readonly initialSizes: SizeEntry[];
}

const COMMON_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Unique'];
const NUMERIC_SIZES = ['34', '36', '38', '40', '42', '44', '46', '48'];

function emptyEntry(): SizeEntry {
  return { size: '' };
}

export function SizeManager({ productId, initialSizes }: SizeManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [sizes, setSizes] = useState<SizeEntry[]>(initialSizes.length > 0 ? initialSizes : []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [shippingOpen, setShippingOpen] = useState(false);

  function addCustomSize() {
    setSaved(false);
    setSizes((prev) => {
      const next = [...prev, emptyEntry()];
      setEditingIndex(next.length - 1);
      return next;
    });
  }

  function removeSize(index: number) {
    setSaved(false);
    setEditingIndex(null);
    setSizes((prev) => prev.filter((_, i) => i !== index));
  }

  function updateField<K extends keyof SizeEntry>(index: number, field: K, value: SizeEntry[K]) {
    setSaved(false);
    setSizes((prev) => prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)));
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    setEditingIndex(null);

    const invalid = sizes.find((s) => !s.size.trim());
    if (invalid !== undefined) {
      setError('Chaque taille doit avoir un nom');
      return;
    }

    const duplicates = sizes.map((s) => s.size.trim().toLowerCase());
    const hasDuplicates = duplicates.length !== new Set(duplicates).size;
    if (hasDuplicates) {
      setError('Deux tailles ont le meme nom');
      return;
    }

    startTransition(async () => {
      const cleanSizes = sizes.map((s) => ({
        size: s.size.trim(),
        ...(s.weight && s.weight > 0 ? { weight: s.weight } : {}),
        ...(s.width && s.width > 0 ? { width: s.width } : {}),
        ...(s.height && s.height > 0 ? { height: s.height } : {}),
        ...(s.length && s.length > 0 ? { length: s.length } : {}),
      }));

      const result = await updateProduct(productId, { sizes: cleanSizes });
      if (!result.success) {
        setError(result.error ?? 'Erreur lors de la sauvegarde');
      } else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  const alreadyAdded = new Set(sizes.map((s) => s.size.trim()));
  const hasShippingData = sizes.some(
    (s) => (s.weight && s.weight > 0) || (s.width && s.width > 0) || (s.height && s.height > 0) || (s.length && s.length > 0)
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Ruler className="h-5 w-5" />
          Tailles
          {sizes.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">({sizes.length})</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex gap-2">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {saved && (
          <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 px-4 py-2.5 flex items-center gap-2">
            <Save className="h-4 w-4 text-green-600 shrink-0" />
            <p className="text-xs text-green-700 dark:text-green-400">Tailles enregistrees</p>
          </div>
        )}

        {/* Quick-add presets */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Ajout rapide</p>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSaved(false);
                  setSizes((prev) => [...prev, { size: s }]);
                }}
                disabled={alreadyAdded.has(s)}
                className="rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {NUMERIC_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSaved(false);
                  setSizes((prev) => [...prev, { size: s }]);
                }}
                disabled={alreadyAdded.has(s)}
                className="rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Size pills */}
        {sizes.length > 0 && (
          <div className="flex flex-wrap gap-2 py-1">
            {sizes.map((entry, index) =>
              editingIndex === index ? (
                <div key={entry.size || `new-${index}`} className="flex items-center gap-1">
                  <Input
                    autoFocus
                    value={entry.size}
                    onChange={(e) => updateField(index, 'size', e.target.value)}
                    onBlur={() => setEditingIndex(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') setEditingIndex(null);
                    }}
                    placeholder="Ex: XS"
                    className="h-8 w-20 text-sm font-medium px-2"
                  />
                </div>
              ) : (
                <div key={entry.size || `new-${index}`} className="group flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors">
                  <button
                    type="button"
                    className="cursor-pointer"
                    onClick={() => setEditingIndex(index)}
                    aria-label={`Modifier la taille ${entry.size}`}
                  >
                    {entry.size || <span className="text-muted-foreground italic">sans nom</span>}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSize(index);
                    }}
                    aria-label={`Supprimer la taille ${entry.size}`}
                    className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )
            )}
            <button
              type="button"
              onClick={addCustomSize}
              className="flex items-center gap-1 rounded-full border border-dashed px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Autre
            </button>
          </div>
        )}

        {sizes.length === 0 && (
          <button
            type="button"
            onClick={addCustomSize}
            className="flex items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Taille personnalisee
          </button>
        )}

        {/* Shipping collapsible */}
        {sizes.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShippingOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-expanded={shippingOpen}
            >
              <span>Parametres d&apos;expedition</span>
              <span className="flex items-center gap-1.5">
                {hasShippingData && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label="Donnees renseignees" />
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
                  Ces informations sont utilisees pour calculer les frais d&apos;envoi.
                </p>
                <ShippingDimensionsTable
                  sizes={sizes}
                  onChange={(idx, field, value) =>
                    updateField(idx, field, value ? Number(value) : undefined)
                  }
                />
              </div>
            )}
          </div>
        )}

        {sizes.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {sizes.length} taille{sizes.length > 1 ? 's' : ''} definie{sizes.length > 1 ? 's' : ''}
            </p>
            <Button onClick={handleSave} disabled={isPending} size="sm" className="gap-2">
              <Save className="h-3.5 w-3.5" />
              {isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
