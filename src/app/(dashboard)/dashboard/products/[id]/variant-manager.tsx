'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createVariant, updateVariant, deleteVariant } from '../actions';
import { Plus, Pencil, Trash2, X, Check, Package } from 'lucide-react';

interface Variant {
  id: string;
  name: string;
  sku?: string;
  priceOverride?: number;
  stock: number;
  isAvailable: boolean;
}

interface VariantManagerProps {
  productId: string;
  variants: Variant[];
}

export function VariantManager({ productId, variants }: VariantManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('0');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('0');

  function resetCreateForm() {
    setNewName('');
    setNewSku('');
    setNewPrice('');
    setNewStock('0');
    setShowCreateForm(false);
    setError(null);
  }

  function startEditing(variant: Variant) {
    setEditingId(variant.id);
    setEditName(variant.name);
    setEditSku(variant.sku ?? '');
    setEditPrice(variant.priceOverride ? (variant.priceOverride / 100).toFixed(2) : '');
    setEditStock(String(variant.stock));
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
      const priceInCents = newPrice ? Math.round(parseFloat(newPrice) * 100) : undefined;
      const result = await createVariant({
        productId,
        name: newName.trim(),
        sku: newSku.trim() || undefined,
        priceOverride: priceInCents && priceInCents > 0 ? priceInCents : undefined,
        stock,
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
      const priceInCents = editPrice ? Math.round(parseFloat(editPrice) * 100) : undefined;
      const result = await updateVariant(variantId, productId, {
        name: editName.trim() || undefined,
        sku: editSku.trim() || undefined,
        removeSku: !editSku.trim() ? true : undefined,
        priceOverride: priceInCents && priceInCents > 0 ? priceInCents : undefined,
        removePriceOverride: !editPrice ? true : undefined,
        stock: !isNaN(stock) ? stock : undefined,
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
          <Button
            onClick={() => setShowCreateForm(true)}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {showCreateForm && (
          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="font-medium text-sm">Nouvelle variante</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="new-variant-name" className="text-xs">Nom *</Label>
                <Input
                  id="new-variant-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Taille M"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-variant-sku" className="text-xs">SKU</Label>
                <Input
                  id="new-variant-sku"
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  placeholder="Ex: PROD-M"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-variant-price" className="text-xs">Prix (EUR)</Label>
                <Input
                  id="new-variant-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Laisser vide = prix produit"
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
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune variante. Ajoutez des variantes pour gerer les tailles, couleurs, etc.
          </p>
        )}

        {variants.map((variant) => (
          <div key={variant.id} className="rounded-lg border p-3">
            {editingId === variant.id ? (
              <div className="space-y-3">
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
                    <Label className="text-xs">SKU</Label>
                    <Input
                      value={editSku}
                      onChange={(e) => setEditSku(e.target.value)}
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
                <div className="flex items-center gap-4">
                  <div>
                    <span className="font-medium text-sm">{variant.name}</span>
                    {variant.sku && (
                      <span className="ml-2 text-xs text-muted-foreground">SKU: {variant.sku}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {variant.priceOverride ? (
                      <span>{(variant.priceOverride / 100).toFixed(2)} EUR</span>
                    ) : (
                      <span className="italic">Prix produit</span>
                    )}
                    <span>Stock: {variant.stock}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        variant.isAvailable
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {variant.isAvailable ? 'Disponible' : 'Epuise'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
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
