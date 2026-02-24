import { Result } from '@/shared/domain';
import type { ImageUploadService } from '../../application/ports/image-upload.service.interface';

/**
 * No-op implementation of ImageUploadService.
 * Returns a placeholder URL for uploaded files.
 * Replace with a real implementation (MinIO, S3) when storage is configured.
 */
export class NoopImageUploadService implements ImageUploadService {
  async upload(_file: Buffer, filename: string): Promise<Result<string>> {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replaceAll(/[^a-zA-Z0-9.-]/g, '_');
    const placeholderUrl = `/uploads/products/${timestamp}-${sanitizedFilename}`;
    return Result.ok(placeholderUrl);
  }

  async delete(_url: string): Promise<Result<void>> {
    return Result.ok();
  }
}
