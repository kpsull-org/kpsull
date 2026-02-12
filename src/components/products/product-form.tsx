'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createProduct, updateProduct, type ActionResult } from '@/app/(dashboard)/dashboard/products/actions';

interface CollectionOption {
  id: string;
  name: string;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  productId?: string;
  initialValues?: {
    name: string;
    description?: string;
    price: number;
    projectId?: string;
  };
  collections: CollectionOption[];
}

export function ProductForm({ mode, productId, initialValues, collections }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [priceEur, setPriceEur] = useState(
    initialValues ? (initialValues.price / 100).toFixed(2) : ''
  );
  const [projectId, setProjectId] = useState(initialValues?.projectId ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const priceInCents = Math.round(parseFloat(priceEur) * 100);

    if (!name.trim()) {
      setError('Le nom du produit est requis');
      return;
    }

    if (isNaN(priceInCents) || priceInCents <= 0) {
      setError('Le prix doit etre un nombre positif');
      return;
    }

    startTransition(async () => {
      let result: ActionResult;

      if (mode === 'create') {
        result = await createProduct({
          name: name.trim(),
          description: description.trim() || undefined,
          price: priceInCents,
          projectId: projectId || undefined,
        });
      } else {
        result = await updateProduct(productId!, {
          name: name.trim(),
          description: description.trim() || undefined,
          price: priceInCents,
          projectId: projectId || null,
        });
      }

      if (!result.success) {
        setError(result.error ?? 'Une erreur est survenue');
        return;
      }

      if (mode === 'create' && result.id) {
        router.push(`/dashboard/products/${result.id}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Nouveau produit' : 'Modifier le produit'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du produit"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du produit..."
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Prix (EUR) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0.01"
              value={priceEur}
              onChange={(e) => setPriceEur(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="collection">Collection</Label>
            <select
              id="collection"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Aucune collection</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Enregistrement...'
                : mode === 'create'
                  ? 'Creer le produit'
                  : 'Enregistrer'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
