'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { publishProduct, unpublishProduct, deleteProduct } from '../actions';
import { Eye, EyeOff, Trash2 } from 'lucide-react';

interface ProductActionsProps {
  productId: string;
  status: string;
}

export function ProductActions({ productId, status }: ProductActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function handlePublish() {
    setError(null);
    startTransition(async () => {
      const result = await publishProduct(productId);
      if (!result.success) {
        setError(result.error ?? 'Erreur lors de la publication');
      } else {
        router.refresh();
      }
    });
  }

  function handleUnpublish() {
    setError(null);
    startTransition(async () => {
      const result = await unpublishProduct(productId);
      if (!result.success) {
        setError(result.error ?? 'Erreur lors de la depublication');
      } else {
        router.refresh();
      }
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (!result.success) {
        setError(result.error ?? 'Erreur lors de la suppression');
      } else {
        router.push('/dashboard/products');
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-sm text-destructive">{error}</span>
      )}

      {status === 'DRAFT' && (
        <Button
          onClick={handlePublish}
          disabled={isPending}
          size="sm"
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          Publier
        </Button>
      )}

      {status === 'PUBLISHED' && (
        <Button
          onClick={handleUnpublish}
          disabled={isPending}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <EyeOff className="h-4 w-4" />
          Depublier
        </Button>
      )}

      {showDeleteConfirm ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Confirmer ?</span>
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
      ) : (
        <Button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isPending}
          variant="outline"
          size="sm"
          className="gap-2 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </Button>
      )}
    </div>
  );
}
