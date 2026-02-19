import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudinaryImageUploadService } from '../cloudinary-image-upload.service';

// Mock @/lib/cloudinary
vi.mock('@/lib/cloudinary', () => ({
  cloudinary: {
    uploader: {
      upload: vi.fn(),
      destroy: vi.fn(),
    },
  },
}));

import { cloudinary } from '@/lib/cloudinary';

describe('CloudinaryImageUploadService', () => {
  let service: CloudinaryImageUploadService;
  const mockUpload = vi.mocked(cloudinary.uploader.upload);
  const mockDestroy = vi.mocked(cloudinary.uploader.destroy);

  beforeEach(() => {
    service = new CloudinaryImageUploadService();
    vi.clearAllMocks();
  });

  describe('upload', () => {
    it('should upload image and return secure_url', async () => {
      mockUpload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image/upload/v123/kpsull/products/abc.jpg',
      } as never);

      const buffer = Buffer.from('fake-image-data');
      const result = await service.upload(buffer, 'photo.jpg');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(
        'https://res.cloudinary.com/test/image/upload/v123/kpsull/products/abc.jpg'
      );
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringContaining('data:image/jpeg;base64,'),
        expect.objectContaining({ folder: 'kpsull/products' })
      );
    });

    it('should detect correct MIME type for png', async () => {
      mockUpload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image/upload/v123/img.png',
      } as never);

      await service.upload(Buffer.from('data'), 'image.png');

      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringContaining('data:image/png;base64,'),
        expect.any(Object)
      );
    });

    it('should detect correct MIME type for webp', async () => {
      mockUpload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image/upload/v123/img.webp',
      } as never);

      await service.upload(Buffer.from('data'), 'photo.webp');

      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringContaining('data:image/webp;base64,'),
        expect.any(Object)
      );
    });

    it('should fallback to image/jpeg for unknown extension', async () => {
      mockUpload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image/upload/v123/img.bmp',
      } as never);

      await service.upload(Buffer.from('data'), 'photo.bmp');

      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringContaining('data:image/jpeg;base64,'),
        expect.any(Object)
      );
    });

    it('should return failure on cloudinary error', async () => {
      mockUpload.mockRejectedValue(new Error('Cloudinary error'));

      const result = await service.upload(Buffer.from('data'), 'photo.jpg');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Erreur lors de l'upload de l'image");
    });
  });

  describe('delete', () => {
    it('should delete image by extracting public_id from URL', async () => {
      mockDestroy.mockResolvedValue({ result: 'ok' } as never);

      const url =
        'https://res.cloudinary.com/mycloud/image/upload/v1234567890/kpsull/products/123-photo.jpg';
      const result = await service.delete(url);

      expect(result.isSuccess).toBe(true);
      expect(mockDestroy).toHaveBeenCalledWith('kpsull/products/123-photo');
    });

    it('should return failure for invalid URL (no cloudinary path)', async () => {
      const result = await service.delete('/uploads/products/local.jpg');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('URL invalide pour la suppression');
    });

    it('should return failure on cloudinary destroy error', async () => {
      mockDestroy.mockRejectedValue(new Error('Delete failed'));

      const url =
        'https://res.cloudinary.com/cloud/image/upload/v123/kpsull/products/img.jpg';
      const result = await service.delete(url);

      expect(result.isFailure).toBe(true);
    });
  });
});
