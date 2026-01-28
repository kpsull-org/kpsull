# Story 4.3: Upload d'Images Produit via Cloudinary

Status: ready-for-dev

## Story

As a Créateur,
I want uploader des images pour mes produits,
so that mes clients puissent voir mes créations.

## Acceptance Criteria

1. **AC1 - Upload d'image**
   - **Given** un Créateur sur la page d'édition de produit
   - **When** il sélectionne une image (max 5MB, formats jpg/png/webp)
   - **Then** l'image est uploadée vers Cloudinary
   - **And** une URL optimisée est générée et stockée dans ProductImage

2. **AC2 - Aperçu immédiat**
   - **Given** une image uploadée
   - **When** l'upload est terminé
   - **Then** un aperçu s'affiche immédiatement

3. **AC3 - Réorganisation des images**
   - **Given** plusieurs images uploadées
   - **When** le Créateur réorganise l'ordre par drag-and-drop
   - **Then** les positions sont mises à jour
   - **And** la première image devient l'image principale

4. **AC4 - Validation des fichiers**
   - **Given** une image trop grande ou format invalide
   - **When** le Créateur tente l'upload
   - **Then** un message d'erreur clair s'affiche
   - **And** l'upload est refusé

## Tasks / Subtasks

- [ ] **Task 1: Configurer Cloudinary** (AC: #1)
  - [ ] 1.1 Créer `src/lib/cloudinary/client.ts`
  - [ ] 1.2 Configurer les variables d'environnement
  - [ ] 1.3 Créer les presets de transformation (thumbnail, medium, large)

- [ ] **Task 2: Créer le service d'upload** (AC: #1, #4)
  - [ ] 2.1 Créer l'interface `IImageUploadService`
  - [ ] 2.2 Implémenter `CloudinaryImageService`
  - [ ] 2.3 Valider taille et format avant upload

- [ ] **Task 3: Créer le composant ImageUploader** (AC: #1, #2, #4)
  - [ ] 3.1 Créer `src/components/products/image-uploader.tsx`
  - [ ] 3.2 Implémenter le drag-and-drop pour upload
  - [ ] 3.3 Afficher la barre de progression
  - [ ] 3.4 Afficher les erreurs de validation

- [ ] **Task 4: Créer le composant ImageGalleryEditor** (AC: #2, #3)
  - [ ] 4.1 Créer `src/components/products/image-gallery-editor.tsx`
  - [ ] 4.2 Afficher les aperçus des images
  - [ ] 4.3 Implémenter le drag-and-drop pour réorganisation
  - [ ] 4.4 Gérer la suppression d'images

- [ ] **Task 5: Créer l'API Route pour upload** (AC: #1)
  - [ ] 5.1 Créer `src/app/api/upload/route.ts`
  - [ ] 5.2 Valider l'authentification
  - [ ] 5.3 Uploader vers Cloudinary
  - [ ] 5.4 Retourner l'URL optimisée

- [ ] **Task 6: Écrire les tests** (AC: #1-4)
  - [ ] 6.1 Tests pour CloudinaryImageService
  - [ ] 6.2 Tests pour la validation des fichiers
  - [ ] 6.3 Tests pour l'API route

## Dev Notes

### Configuration Cloudinary

```typescript
// src/lib/cloudinary/client.ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export { cloudinary };

// Presets de transformation
export const TRANSFORMATIONS = {
  thumbnail: { width: 150, height: 150, crop: "fill", quality: "auto" },
  medium: { width: 600, height: 600, crop: "limit", quality: "auto" },
  large: { width: 1200, height: 1200, crop: "limit", quality: "auto" },
};
```

### Service Cloudinary

```typescript
// src/modules/products/infrastructure/services/cloudinary-image.service.ts
import { cloudinary, TRANSFORMATIONS } from "@/lib/cloudinary/client";
import { Result } from "@/shared/domain";

interface UploadOptions {
  folder: string;
  transformation?: Record<string, unknown>;
}

interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  thumbnailUrl: string;
}

export class CloudinaryImageService implements IImageUploadService {
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp"];

  validateFile(file: File): Result<void> {
    if (file.size > this.MAX_FILE_SIZE) {
      return Result.fail("L'image ne doit pas dépasser 5MB");
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !this.ALLOWED_FORMATS.includes(extension)) {
      return Result.fail("Format accepté : JPG, PNG, WebP");
    }

    return Result.ok();
  }

  async upload(file: Buffer, options: UploadOptions): Promise<Result<UploadResult>> {
    try {
      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: options.folder,
            resource_type: "image",
            transformation: options.transformation || TRANSFORMATIONS.large,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(file);
      });

      return Result.ok({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        thumbnailUrl: cloudinary.url(result.public_id, TRANSFORMATIONS.thumbnail),
      });
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      return Result.fail("Erreur lors de l'upload de l'image");
    }
  }

  async delete(publicId: string): Promise<Result<void>> {
    try {
      await cloudinary.uploader.destroy(publicId);
      return Result.ok();
    } catch (error) {
      return Result.fail("Erreur lors de la suppression de l'image");
    }
  }
}
```

### Composant ImageUploader

```typescript
// src/components/products/image-uploader.tsx
"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onUpload: (file: File) => Promise<void>;
  maxFiles?: number;
  disabled?: boolean;
}

export function ImageUploader({ onUpload, maxFiles = 10, disabled }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    setIsUploading(true);

    try {
      for (const file of acceptedFiles) {
        // Validation côté client
        if (file.size > 5 * 1024 * 1024) {
          setError("L'image ne doit pas dépasser 5MB");
          continue;
        }
        await onUpload(file);
      }
    } catch (err) {
      setError("Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles,
    disabled: disabled || isUploading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
        isDragActive && "border-primary bg-primary/10",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
      ) : (
        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
      )}
      <p className="mt-2 text-sm text-muted-foreground">
        {isDragActive
          ? "Déposez les images ici..."
          : "Glissez-déposez ou cliquez pour sélectionner"}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        JPG, PNG, WebP - Max 5MB
      </p>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
```

### Schéma Prisma ProductImage

```prisma
model ProductImage {
  id          String   @id @default(cuid())
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  url         String
  publicId    String   // Cloudinary public_id for deletion
  position    Int      @default(0)
  width       Int?
  height      Int?

  createdAt   DateTime @default(now())

  @@index([productId])
  @@map("product_images")
}
```

### Variables d'Environnement

```bash
# .env.local
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### Références

- [Source: architecture.md#Cloudinary Integration]
- [Source: prd.md#FR17]
- [Source: epics.md#Story 4.3]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
