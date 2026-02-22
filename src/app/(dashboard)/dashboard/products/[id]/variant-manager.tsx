'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createVariant, updateVariant, deleteVariant, addVariantImage, removeVariantImage } from '../actions';
import { compressImage } from '@/lib/utils/image-compression';
import { PRESET_COLORS } from '@/lib/utils/product-colors';
import { Plus, Pencil, Trash2, X, Check, Package, AlertCircle, ImagePlus } from 'lucide-react';

interface Variant {
  id: string;
  name: string;
  priceOverride?: number;
  stock: number;
  isAvailable: boolean;
  color?: string;
  colorCode?: string;
  images: string[];
}

interface VariantManagerProps {
  readonly productId: string;
  readonly variants: Variant[];
}

interface ColorPickerProps {
  readonly colorName: string;
  readonly colorCode: string;
  readonly onColorNameChange: (v: string) => void;
  readonly onColorCodeChange: (v: string) => void;
  readonly idPrefix: string;
}

function ColorPicker({ colorName, colorCode, onColorNameChange, onColorCodeChange, idPrefix }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">Couleur</Label>
      <div className="flex gap-2">
        <div className="relative">
          <input
            type="color"
            value={colorCode || '#000000'}
            onChange={(e) => {
              onColorCodeChange(e.target.value);
              if (!colorName) {
                const preset = PRESET_COLORS.find(
                  (c) => c.hex.toLowerCase() === e.target.value.toLowerCase()
                );
                if (preset) onColorNameChange(preset.name);
              }
            }}
            className="h-9 w-12 cursor-pointer rounded-md border border-input p-0.5"
            id={`${idPrefix}-color-picker`}
          />
        </div>
        <Input
          id={`${idPrefix}-color-name`}
          value={colorName}
          onChange={(e) => onColorNameChange(e.target.value)}
          placeholder="Nom (ex: Bleu marine)"
          className="h-9 flex-1"
        />
        <Input
          value={colorCode}
          onChange={(e) => onColorCodeChange(e.target.value)}
          placeholder="#000000"
          className="h-9 w-28 font-mono text-xs"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((c) => (
          <button
            key={c.hex}
            type="button"
            title={c.name}
            onClick={() => {
              onColorCodeChange(c.hex);
              onColorNameChange(c.name);
            }}
            className="h-5 w-5 rounded-full border border-border transition-transform hover:scale-110"
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>
    </div>
  );
}

interface VariantImageSlotProps {
  readonly variantId: string;
  readonly productId: string;
  readonly images: string[];
  readonly isLoading?: boolean;
}

function VariantImageSlot({ variantId, productId, images, isLoading }: VariantImageSlotProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localImages, setLocalImages] = useState(images);
  const firstImage = localImages[0];

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file, { maxDimension: 1200, quality: 0.85 });
      const formData = new FormData();
      formData.append('file', compressed.file);
      const result = await addVariantImage(variantId, productId, formData);
      if (result.success && result.url) {
        setLocalImages((prev) => [...prev, result.url!]);
        router.refresh();
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!firstImage) return;
    setUploading(true);
    try {
      await removeVariantImage(variantId, productId, firstImage);
      setLocalImages((prev) => prev.filter((u) => u !== firstImage));
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative h-14 w-14 shrink-0 rounded-lg border-2 border-dashed border-muted-foreground/30 overflow-hidden hover:border-muted-foreground/60 transition-colors group">
      <button
        type="button"
        className="absolute inset-0 w-full h-full cursor-pointer"
        onClick={() => !uploading && fileInputRef.current?.click()}
        title={firstImage ? 'Changer la photo' : 'Ajouter une photo'}
        aria-label={firstImage ? 'Changer la photo' : 'Ajouter une photo'}
      >
        {firstImage ? (
          <>
            <img src={firstImage} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <button
                type="button"
                onClick={handleDelete}
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center"
                aria-label="Supprimer la photo"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
            {uploading ? (
              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/50 border-t-transparent animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
          </div>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading || isLoading}
      />
    </div>
  );
}

export function VariantManager({ productId, variants }: VariantManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('0');
  const [newColor, setNewColor] = useState('');
  const [newColorCode, setNewColorCode] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('0');
  const [editColor, setEditColor] = useState('');
  const [editColorCode, setEditColorCode] = useState('');

  function resetCreateForm() {
    setNewName('');
    setNewPrice('');
    setNewStock('0');
    setNewColor('');
    setNewColorCode('');
    setShowCreateForm(false);
    setError(null);
  }

  function startEditing(variant: Variant) {
    setEditingId(variant.id);
    setEditName(variant.name);
    setEditPrice(variant.priceOverride ? (variant.priceOverride / 100).toFixed(2) : '');
    setEditStock(String(variant.stock));
    setEditColor(variant.color ?? '');
    setEditColorCode(variant.colorCode ?? '');
    setError(null);
  }

  function handleCreate() {
    setError(null);
    const stock = parseInt(newStock, 10);
    if (!newName.trim()) {
      setError('Le nom de la variante est requis');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      setError('Le stock doit etre un nombre positif ou zero');
      return;
    }

    startTransition(async () => {
      const parsedPrice = newPrice ? parseFloat(newPrice) : undefined;
      const result = await createVariant({
        productId,
        name: newName.trim(),
        priceOverride: parsedPrice && parsedPrice > 0 ? parsedPrice : undefined,
        stock,
        color: newColor.trim() || undefined,
        colorCode: newColorCode.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error ?? 'Erreur lors de la creation');
      } else {
        resetCreateForm();
        router.refresh();
      }
    });
  }

  function handleUpdate(variantId: string) {
    setError(null);
    const stock = parseInt(editStock, 10);

    startTransition(async () => {
      const parsedPrice = editPrice ? parseFloat(editPrice) : undefined;
      const result = await updateVariant(variantId, productId, {
        name: editName.trim() || undefined,
        priceOverride: parsedPrice && parsedPrice > 0 ? parsedPrice : undefined,
        removePriceOverride: !editPrice ? true : undefined,
        stock: !isNaN(stock) ? stock : undefined,
        color: editColor.trim() || undefined,
        colorCode: editColorCode.trim() || undefined,
        removeColor: !editColor.trim() ? true : undefined,
      });

      if (!result.success) {
        setError(result.error ?? 'Erreur lors de la mise a jour');
      } else {
        setEditingId(null);
        router.refresh();
      }
    });
  }

  function handleDelete(variantId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteVariant(variantId, productId);
      if (!result.success) {
        setError(result.error ?? 'Erreur lors de la suppression');
      } else {
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Variantes ({variants.length})
        </CardTitle>
        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex gap-2">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {showCreateForm && (
          <div className="rounded-lg border p-4 space-y-4 bg-muted/20">
            <h4 className="font-medium text-sm">Nouvelle variante</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="new-variant-name" className="text-xs">Nom *</Label>
                <Input
                  id="new-variant-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Taille M, Bleu S..."
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-variant-price" className="text-xs">Prix specifique (EUR)</Label>
                <Input
                  id="new-variant-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Vide = prix du produit"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-variant-stock" className="text-xs">Stock *</Label>
                <Input
                  id="new-variant-stock"
                  type="number"
                  min="0"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
            <ColorPicker
              colorName={newColor}
              colorCode={newColorCode}
              onColorNameChange={setNewColor}
              onColorCodeChange={setNewColorCode}
              idPrefix="new"
            />
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={isPending} size="sm" className="gap-1">
                <Check className="h-3 w-3" />
                Creer
              </Button>
              <Button onClick={resetCreateForm} disabled={isPending} variant="outline" size="sm" className="gap-1">
                <X className="h-3 w-3" />
                Annuler
              </Button>
            </div>
          </div>
        )}

        {variants.length === 0 && !showCreateForm && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Aucune variante. Ajoutez des variantes pour gerer les couleurs, tailles, editions limitees...
          </p>
        )}

        {variants.map((variant) => (
          <div key={variant.id} className="rounded-lg border p-3">
            {editingId === variant.id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nom</Label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Prix (EUR)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder="Prix produit"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Stock</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editStock}
                      onChange={(e) => setEditStock(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
                <ColorPicker
                  colorName={editColor}
                  colorCode={editColorCode}
                  onColorNameChange={setEditColor}
                  onColorCodeChange={setEditColorCode}
                  idPrefix={`edit-${variant.id}`}
                />
                <div className="flex gap-2">
                  <Button onClick={() => handleUpdate(variant.id)} disabled={isPending} size="sm" className="gap-1">
                    <Check className="h-3 w-3" />
                    Enregistrer
                  </Button>
                  <Button onClick={() => setEditingId(null)} disabled={isPending} variant="outline" size="sm" className="gap-1">
                    <X className="h-3 w-3" />
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <VariantImageSlot
                    variantId={variant.id}
                    productId={productId}
                    images={variant.images}
                    isLoading={isPending}
                  />
                  {variant.colorCode && (
                    <div
                      className="h-6 w-6 rounded-full border-2 border-border shrink-0"
                      style={{ backgroundColor: variant.colorCode }}
                      title={variant.color ?? variant.colorCode}
                    />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{variant.name}</span>
                      {variant.color && (
                        <span className="text-xs text-muted-foreground">{variant.color}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {variant.priceOverride ? (
                        <span className="text-xs text-muted-foreground">
                          {(variant.priceOverride / 100).toFixed(2)} EUR
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Prix produit</span>
                      )}
                      <span className="text-xs text-muted-foreground">Stock : {variant.stock}</span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          variant.isAvailable
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {variant.isAvailable ? 'Disponible' : 'Epuise'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    onClick={() => startEditing(variant)}
                    disabled={isPending}
                    variant="ghost"
                    size="sm"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(variant.id)}
                    disabled={isPending}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
