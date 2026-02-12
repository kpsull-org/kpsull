'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createCollection, updateCollection, type ActionResult } from '../actions';

interface CollectionFormProps {
  mode: 'create' | 'edit';
  collectionId?: string;
  initialValues?: {
    name: string;
    description?: string;
  };
}

export function CollectionForm({ mode, collectionId, initialValues }: CollectionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Le nom de la collection est requis');
      return;
    }

    startTransition(async () => {
      let result: ActionResult;

      if (mode === 'create') {
        result = await createCollection({
          name: name.trim(),
          description: description.trim() || undefined,
        });
      } else {
        result = await updateCollection(collectionId!, {
          name: name.trim(),
          description: description.trim() || undefined,
        });
      }

      if (!result.success) {
        setError(result.error ?? 'Une erreur est survenue');
        return;
      }

      if (mode === 'create' && result.id) {
        router.push(`/dashboard/collections/${result.id}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Nouvelle collection' : 'Modifier la collection'}
        </CardTitle>
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
              placeholder="Nom de la collection"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la collection..."
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Enregistrement...'
                : mode === 'create'
                  ? 'Creer la collection'
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
