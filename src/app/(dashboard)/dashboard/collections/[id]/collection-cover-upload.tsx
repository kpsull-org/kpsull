'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { uploadCollectionCoverImage } from '../actions';
import { ImagePlus, ImageIcon, AlertCircle, Info } from 'lucide-react';
import { compressImage, formatFileSize } from '@/lib/utils/image-compression';

interface CollectionCoverUploadProps {
  readonly collectionId: string;
  readonly currentCoverImage: string | null;
}

interface UploadState {
  isCompressing: boolean;
  originalSize?: number;
  compressedSize?: number;
}

export function CollectionCoverUpload({
  collectionId,
  currentCoverImage,
}: CollectionCoverUploadProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
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

      const result = await uploadCollectionCoverImage(collectionId, formData);
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

  const isLoading = isPending || uploadState.isCompressing;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Image de couverture
        </CardTitle>
        <Button onClick={handleUpload} disabled={isLoading} size="sm" className="gap-2">
          <ImagePlus className="h-4 w-4" />
          {(() => {
            if (uploadState.isCompressing) return 'Optimisation...';
            if (currentCoverImage) return 'Changer';
            return 'Ajouter';
          })()}
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

        {currentCoverImage ? (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
            <img
              src={currentCoverImage}
              alt="Couverture de la collection"
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors w-full"
              onClick={handleUpload}
            >
              <ImageIcon className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium text-muted-foreground">
                Cliquez pour ajouter une image de couverture
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG ou WebP · Format paysage recommande</p>
            </button>
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-3">
              <div className="flex gap-2.5">
                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                    Conseils pour l&apos;image de couverture
                  </p>
                  <ul className="text-xs text-blue-600/80 dark:text-blue-500/80 space-y-0.5 list-disc list-inside">
                    <li>Format paysage (16:9) pour un meilleur rendu</li>
                    <li>Resolution minimale recommandee : 1200 × 675 px</li>
                    <li>Choisissez une image representative de votre collection</li>
                    <li>L&apos;image est automatiquement convertie en WebP</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
