import { cloudinary } from '@/lib/cloudinary';
import { Result } from '@/shared/domain';
import type { ImageUploadService } from '../../application/ports/image-upload.service.interface';

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  return MIME_TYPES[ext ?? ''] ?? 'image/jpeg';
}

function extractPublicId(url: string): string | null {
  // Cloudinary URL format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}.{ext}
  const match = url.match(/\/image\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
  return match?.[1] ?? null;
}

/**
 * Cloudinary implementation of ImageUploadService.
 * Handles upload and deletion of product images using the Cloudinary API.
 */
export class CloudinaryImageUploadService implements ImageUploadService {
  async upload(file: Buffer, filename: string): Promise<Result<string>> {
    try {
      const mimeType = getMimeType(filename);
      const sanitized = filename
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9-]/g, '_');
      const publicId = `${Date.now()}-${sanitized}`;
      const base64 = `data:${mimeType};base64,${file.toString('base64')}`;

      const result = await cloudinary.uploader.upload(base64, {
        folder: 'kpsull/products',
        public_id: publicId,
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      });

      return Result.ok(result.secure_url);
    } catch {
      return Result.fail("Erreur lors de l'upload de l'image");
    }
  }

  async delete(url: string): Promise<Result<void>> {
    try {
      const publicId = extractPublicId(url);
      if (!publicId) {
        return Result.fail('URL invalide pour la suppression');
      }
      await cloudinary.uploader.destroy(publicId);
      return Result.ok();
    } catch {
      return Result.fail("Erreur lors de la suppression de l'image");
    }
  }
}
