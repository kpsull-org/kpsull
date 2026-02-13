'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, X } from 'lucide-react';
import {
  updateCollection,
  deleteCollection,
  assignProductToCollection,
  removeProductFromCollection,
} from '../actions';

interface ProductItem {
  id: string;
  name: string;
  price: number;
  status: string;
}

interface CollectionDetailProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
  };
  products: ProductItem[];
  unassignedProducts: ProductItem[];
}

const amountFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

function formatPrice(cents: number): string {
  return amountFormatter.format(cents / 100);
}

export function CollectionDetail({
  collection,
  products,
  unassignedProducts,
}: CollectionDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');

  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description ?? '');

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateCollection(collection.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error ?? 'Erreur lors de la mise a jour');
      } else {
        router.refresh();
      }
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteCollection(collection.id);
      if (!result.success) {
        setError(result.error ?? 'Erreur lors de la suppression');
      } else {
        router.push('/dashboard/collections');
      }
    });
  }

  function handleAssignProduct() {
    if (!selectedProductId) return;
    setError(null);

    startTransition(async () => {
      const result = await assignProductToCollection(selectedProductId, collection.id);
      if (!result.success) {
        setError(result.error ?? "Erreur lors de l'assignation");
      } else {
        setSelectedProductId('');
        setShowAddProduct(false);
        router.refresh();
      }
    });
  }

  function handleRemoveProduct(productId: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeProductFromCollection(productId);
      if (!result.success) {
        setError(result.error ?? 'Erreur lors du retrait');
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {error && (
        <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <Button type="submit" disabled={isPending}>
              {isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Produits ({products.length})</CardTitle>
            {unassignedProducts.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => setShowAddProduct(!showAddProduct)}
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showAddProduct && (
            <div className="flex items-end gap-3 mb-4 pb-4 border-b">
              <div className="flex-1 space-y-2">
                <Label htmlFor="add-product">Selectionner un produit</Label>
                <select
                  id="add-product"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Choisir un produit...</option>
                  {unassignedProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {formatPrice(p.price)}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handleAssignProduct}
                disabled={isPending || !selectedProductId}
                size="sm"
              >
                Ajouter
              </Button>
            </div>
          )}

          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aucun produit dans cette collection.
            </p>
          ) : (
            <div className="space-y-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <span className="font-medium text-sm">{product.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                  <Button
                    onClick={() => handleRemoveProduct(product.id)}
                    disabled={isPending}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Zone de danger</CardTitle>
        </CardHeader>
        <CardContent>
          {showDeleteConfirm ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Supprimer cette collection ? Les produits ne seront pas supprimes mais ne seront
                plus associes a aucune collection.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleDelete}
                  disabled={isPending}
                  variant="destructive"
                  size="sm"
                >
                  Oui, supprimer
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isPending}
                  variant="outline"
                  size="sm"
                >
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer la collection
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
