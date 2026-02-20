'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { uploadProductImage, deleteProductImage, reorderProductImages } from '../actions';
import { ImagePlus, Trash2, GripVertical, ImageIcon, AlertCircle, Info } from 'lucide-react';
import { compressImage, formatFileSize } from '@/lib/utils/image-compression';

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

interface UploadState {
  isCompressing: boolean;
  originalSize?: number;
  compressedSize?: number;
}

export function ImageManager({ productId, images }: ImageManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({ isCompressing: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUpload() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadState({ isCompressing: true, originalSize: file.size });

    let fileToUpload = file;

    try {
      const result = await compressImage(file, { maxDimension: 2000, quality: 0.85 });
      fileToUpload = result.file;
      setUploadState({
        isCompressing: false,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
      });
    } catch {
      setUploadState({ isCompressing: false });
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('alt', file.name.replace(/\.[^/.]+$/, ''));

      const result = await uploadProductImage(productId, formData);
      if (!result.success) {
        setError(result.error ?? "Erreur lors de l'upload");
        setUploadState({ isCompressing: false });
      } else {
        router.refresh();
      }
    });

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

  const isLoading = isPending || uploadState.isCompressing;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Images ({images.length})
        </CardTitle>
        <Button onClick={handleUpload} disabled={isLoading} size="sm" className="gap-2">
          <ImagePlus className="h-4 w-4" />
          {uploadState.isCompressing ? 'Optimisation...' : 'Ajouter'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-destructive">{error}</p>
                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                  <li>Formats acceptes : JPG, PNG, WebP</li>
                  <li>Les images sont automatiquement compressees en WebP</li>
                  <li>Taille maximale : 10 Mo avant compression</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {uploadState.compressedSize !== undefined && uploadState.originalSize !== undefined && (
          <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 px-4 py-2.5 flex items-center gap-2">
            <Info className="h-4 w-4 text-green-600 shrink-0" />
            <p className="text-xs text-green-700 dark:text-green-400">
              Image optimisee :{' '}
              <span className="font-medium">{formatFileSize(uploadState.originalSize)}</span> →{' '}
              <span className="font-medium">{formatFileSize(uploadState.compressedSize)}</span>{' '}
              <span className="opacity-70">
                ({Math.round((1 - uploadState.compressedSize / uploadState.originalSize) * 100)}%
                plus legere)
              </span>
            </p>
          </div>
        )}

        {images.length === 0 ? (
          <div className="space-y-3">
            <div
              className="flex flex-col items-center justify-center py-10 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={handleUpload}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleUpload(); }}
            >
              <ImageIcon className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium text-muted-foreground">
                Cliquez pour ajouter votre premiere image
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG ou WebP</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-3">
              <div className="flex gap-2.5">
                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                    Conseils pour de bonnes photos produit
                  </p>
                  <ul className="text-xs text-blue-600/80 dark:text-blue-500/80 space-y-0.5 list-disc list-inside">
                    <li>Privilegiez un fond uni et une bonne lumiere naturelle</li>
                    <li>La premiere image sera votre photo principale dans la boutique</li>
                    <li>Ajoutez plusieurs angles pour rassurer l&apos;acheteur</li>
                    <li>Les images sont automatiquement converties en WebP (taille reduite)</li>
                  </ul>
                </div>
              </div>
            </div>
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
                    disabled={isLoading}
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
          <p className="text-xs text-muted-foreground">
            Glissez-deposez les images pour changer leur ordre. La premiere image sera
            l&apos;image principale.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
