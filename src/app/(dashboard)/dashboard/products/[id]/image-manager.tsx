'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { uploadProductImage, deleteProductImage, reorderProductImages } from '../actions';
import { ImagePlus, Trash2, GripVertical, ImageIcon } from 'lucide-react';

interface ProductImageData {
  id: string;
  url: string;
  alt: string;
  position: number;
}

interface ImageManagerProps {
  productId: string;
  images: ProductImageData[];
}

export function ImageManager({ productId, images }: ImageManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUpload() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', file.name.replace(/\.[^/.]+$/, ''));

      const result = await uploadProductImage(productId, formData);
      if (!result.success) {
        setError(result.error ?? "Erreur lors de l'upload");
      } else {
        router.refresh();
      }
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleDelete(imageId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteProductImage(imageId, productId);
      if (!result.success) {
        setError(result.error ?? 'Erreur lors de la suppression');
      } else {
        router.refresh();
      }
    });
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newOrder = [...images];
    const dragged = newOrder[draggedIndex];
    if (!dragged) {
      setDraggedIndex(null);
      return;
    }
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, dragged);

    setDraggedIndex(null);
    setError(null);

    startTransition(async () => {
      const result = await reorderProductImages(
        productId,
        newOrder.map((img) => img.id)
      );
      if (!result.success) {
        setError(result.error ?? 'Erreur lors du reordonnancement');
      }
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Images ({images.length})
        </CardTitle>
        <Button onClick={handleUpload} disabled={isPending} size="sm" className="gap-2">
          <ImagePlus className="h-4 w-4" />
          Ajouter
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive mb-4">
            {error}
          </div>
        )}

        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">Aucune image. Ajoutez des photos de votre produit.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((image, index) => (
              <div
                key={image.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className={`group relative aspect-square rounded-lg border bg-muted overflow-hidden cursor-grab active:cursor-grabbing ${
                  draggedIndex === index ? 'opacity-50' : ''
                }`}
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  className="h-full w-full object-cover"
                />

                {index === 0 && (
                  <span className="absolute top-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                    Principal
                  </span>
                )}

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />

                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    onClick={() => handleDelete(image.id)}
                    disabled={isPending}
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <div className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-4 w-4 text-white drop-shadow" />
                </div>
              </div>
            ))}
          </div>
        )}

        {images.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            Glissez-deposez les images pour changer leur ordre. La premiere image sera l&apos;image principale.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
