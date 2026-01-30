import { describe, it, expect } from 'vitest';
import {
  validateImageFile,
  detectMimeType,
  getFileExtension,
  isAllowedExtension,
  formatFileSize,
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
} from '../file-validation';

describe('file-validation', () => {
  describe('detectMimeType', () => {
    it('should detect JPEG files', () => {
      // JPEG magic bytes: FF D8 FF
      const jpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      ]);
      expect(detectMimeType(jpegBuffer)).toBe('image/jpeg');
    });

    it('should detect PNG files', () => {
      // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      ]);
      expect(detectMimeType(pngBuffer)).toBe('image/png');
    });

    it('should detect GIF87a files', () => {
      // GIF87a magic bytes: 47 49 46 38 37 61
      const gifBuffer = Buffer.from([
        0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00,
      ]);
      expect(detectMimeType(gifBuffer)).toBe('image/gif');
    });

    it('should detect GIF89a files', () => {
      // GIF89a magic bytes: 47 49 46 38 39 61
      const gifBuffer = Buffer.from([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00,
      ]);
      expect(detectMimeType(gifBuffer)).toBe('image/gif');
    });

    it('should detect WebP files', () => {
      // WebP magic bytes: RIFF....WEBP
      const webpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00, // file size placeholder
        0x57, 0x45, 0x42, 0x50, // WEBP
      ]);
      expect(detectMimeType(webpBuffer)).toBe('image/webp');
    });

    it('should return null for unknown file types', () => {
      const unknownBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b]);
      expect(detectMimeType(unknownBuffer)).toBeNull();
    });

    it('should return null for too small buffers', () => {
      const smallBuffer = Buffer.from([0xff, 0xd8]);
      expect(detectMimeType(smallBuffer)).toBeNull();
    });

    it('should return null for PDF files (not allowed)', () => {
      // PDF magic bytes: %PDF
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x00, 0x00, 0x00, 0x00]);
      expect(detectMimeType(pdfBuffer)).toBeNull();
    });
  });

  describe('getFileExtension', () => {
    it('should extract .jpg extension', () => {
      expect(getFileExtension('image.jpg')).toBe('.jpg');
    });

    it('should extract .jpeg extension', () => {
      expect(getFileExtension('photo.jpeg')).toBe('.jpeg');
    });

    it('should extract .png extension', () => {
      expect(getFileExtension('screenshot.png')).toBe('.png');
    });

    it('should extract .webp extension', () => {
      expect(getFileExtension('modern.webp')).toBe('.webp');
    });

    it('should extract .gif extension', () => {
      expect(getFileExtension('animation.gif')).toBe('.gif');
    });

    it('should return lowercase extension', () => {
      expect(getFileExtension('IMAGE.JPG')).toBe('.jpg');
      expect(getFileExtension('Photo.PNG')).toBe('.png');
    });

    it('should handle multiple dots in filename', () => {
      expect(getFileExtension('my.photo.2024.jpg')).toBe('.jpg');
    });

    it('should return empty string for files without extension', () => {
      expect(getFileExtension('noextension')).toBe('');
    });

    it('should return empty string for files ending with dot', () => {
      expect(getFileExtension('file.')).toBe('');
    });
  });

  describe('isAllowedExtension', () => {
    it('should allow .jpg extension', () => {
      expect(isAllowedExtension('.jpg')).toBe(true);
      expect(isAllowedExtension('jpg')).toBe(true);
    });

    it('should allow .jpeg extension', () => {
      expect(isAllowedExtension('.jpeg')).toBe(true);
      expect(isAllowedExtension('jpeg')).toBe(true);
    });

    it('should allow .png extension', () => {
      expect(isAllowedExtension('.png')).toBe(true);
      expect(isAllowedExtension('png')).toBe(true);
    });

    it('should allow .webp extension', () => {
      expect(isAllowedExtension('.webp')).toBe(true);
      expect(isAllowedExtension('webp')).toBe(true);
    });

    it('should allow .gif extension', () => {
      expect(isAllowedExtension('.gif')).toBe(true);
      expect(isAllowedExtension('gif')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isAllowedExtension('.JPG')).toBe(true);
      expect(isAllowedExtension('.PNG')).toBe(true);
      expect(isAllowedExtension('WEBP')).toBe(true);
    });

    it('should reject disallowed extensions', () => {
      expect(isAllowedExtension('.pdf')).toBe(false);
      expect(isAllowedExtension('.exe')).toBe(false);
      expect(isAllowedExtension('.svg')).toBe(false);
      expect(isAllowedExtension('.bmp')).toBe(false);
    });
  });

  describe('validateImageFile', () => {
    // Helper to create valid image buffers
    const createJpegBuffer = (size = 100): Buffer => {
      const buffer = Buffer.alloc(size);
      // JPEG magic bytes
      buffer[0] = 0xff;
      buffer[1] = 0xd8;
      buffer[2] = 0xff;
      return buffer;
    };

    const createPngBuffer = (size = 100): Buffer => {
      const buffer = Buffer.alloc(size);
      // PNG magic bytes
      buffer.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
      return buffer;
    };

    const createGifBuffer = (size = 100): Buffer => {
      const buffer = Buffer.alloc(size);
      // GIF89a magic bytes
      buffer.set([0x47, 0x49, 0x46, 0x38, 0x39, 0x61], 0);
      return buffer;
    };

    const createWebpBuffer = (size = 100): Buffer => {
      const buffer = Buffer.alloc(size);
      // RIFF....WEBP
      buffer.set([0x52, 0x49, 0x46, 0x46], 0);
      buffer.set([0x57, 0x45, 0x42, 0x50], 8);
      return buffer;
    };

    describe('valid files', () => {
      it('should accept valid JPEG file with .jpg extension', () => {
        const buffer = createJpegBuffer();
        const result = validateImageFile(buffer, 'photo.jpg');
        expect(result.isSuccess).toBe(true);
      });

      it('should accept valid JPEG file with .jpeg extension', () => {
        const buffer = createJpegBuffer();
        const result = validateImageFile(buffer, 'photo.jpeg');
        expect(result.isSuccess).toBe(true);
      });

      it('should accept valid PNG file', () => {
        const buffer = createPngBuffer();
        const result = validateImageFile(buffer, 'screenshot.png');
        expect(result.isSuccess).toBe(true);
      });

      it('should accept valid GIF file', () => {
        const buffer = createGifBuffer();
        const result = validateImageFile(buffer, 'animation.gif');
        expect(result.isSuccess).toBe(true);
      });

      it('should accept valid WebP file', () => {
        const buffer = createWebpBuffer();
        const result = validateImageFile(buffer, 'modern.webp');
        expect(result.isSuccess).toBe(true);
      });
    });

    describe('file size validation', () => {
      it('should reject empty files', () => {
        const buffer = Buffer.alloc(0);
        const result = validateImageFile(buffer, 'empty.jpg');
        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('vide');
      });

      it('should reject files exceeding MAX_FILE_SIZE', () => {
        const buffer = createJpegBuffer(MAX_FILE_SIZE + 1);
        const result = validateImageFile(buffer, 'large.jpg');
        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('volumineux');
        expect(result.error).toContain('10 MB');
      });

      it('should accept files at exactly MAX_FILE_SIZE', () => {
        const buffer = createJpegBuffer(MAX_FILE_SIZE);
        const result = validateImageFile(buffer, 'exactly-max.jpg');
        expect(result.isSuccess).toBe(true);
      });
    });

    describe('filename validation', () => {
      it('should reject empty filename', () => {
        const buffer = createJpegBuffer();
        const result = validateImageFile(buffer, '');
        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('nom du fichier');
      });

      it('should reject whitespace-only filename', () => {
        const buffer = createJpegBuffer();
        const result = validateImageFile(buffer, '   ');
        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('nom du fichier');
      });

      it('should reject files without extension', () => {
        const buffer = createJpegBuffer();
        const result = validateImageFile(buffer, 'noextension');
        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('extension');
      });
    });

    describe('extension validation', () => {
      it('should reject disallowed extensions', () => {
        const buffer = createJpegBuffer();
        const result = validateImageFile(buffer, 'malicious.exe');
        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('Extension');
        expect(result.error).toContain('.exe');
      });

      it('should reject PDF files', () => {
        const buffer = createJpegBuffer();
        const result = validateImageFile(buffer, 'document.pdf');
        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('Extension');
      });

      it('should reject SVG files (potential XSS)', () => {
        const buffer = createJpegBuffer();
        const result = validateImageFile(buffer, 'vector.svg');
        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('Extension');
      });
    });

    describe('MIME type validation', () => {
      it('should reject files with unrecognized content', () => {
        const buffer = Buffer.alloc(100);
        // Random bytes, not a valid image
        buffer.set([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b], 0);
        const result = validateImageFile(buffer, 'fake.jpg');
        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('Type de fichier non reconnu');
      });

      it('should reject executable disguised as image', () => {
        const buffer = Buffer.alloc(100);
        // PE executable magic bytes (MZ)
        buffer.set([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00], 0);
        const result = validateImageFile(buffer, 'virus.jpg');
        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('Type de fichier non reconnu');
      });
    });

    describe('extension/content mismatch validation', () => {
      it('should reject PNG content with .jpg extension', () => {
        const buffer = createPngBuffer();
        const result = validateImageFile(buffer, 'actually-png.jpg');
        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('ne correspond pas');
        expect(result.error).toContain('image/png');
      });

      it('should reject JPEG content with .png extension', () => {
        const buffer = createJpegBuffer();
        const result = validateImageFile(buffer, 'actually-jpeg.png');
        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('ne correspond pas');
        expect(result.error).toContain('image/jpeg');
      });

      it('should reject GIF content with .webp extension', () => {
        const buffer = createGifBuffer();
        const result = validateImageFile(buffer, 'actually-gif.webp');
        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('ne correspond pas');
      });

      it('should reject WebP content with .gif extension', () => {
        const buffer = createWebpBuffer();
        const result = validateImageFile(buffer, 'actually-webp.gif');
        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('ne correspond pas');
      });
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(2048)).toBe('2.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
      expect(formatFileSize(5 * 1024 * 1024)).toBe('5.00 MB');
      expect(formatFileSize(10 * 1024 * 1024)).toBe('10.00 MB');
    });
  });

  describe('constants', () => {
    it('should have MAX_FILE_SIZE of 10MB', () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    });

    it('should have correct ALLOWED_EXTENSIONS', () => {
      expect(ALLOWED_EXTENSIONS).toContain('.jpg');
      expect(ALLOWED_EXTENSIONS).toContain('.jpeg');
      expect(ALLOWED_EXTENSIONS).toContain('.png');
      expect(ALLOWED_EXTENSIONS).toContain('.webp');
      expect(ALLOWED_EXTENSIONS).toContain('.gif');
      expect(ALLOWED_EXTENSIONS.length).toBe(5);
    });

    it('should have correct ALLOWED_MIME_TYPES', () => {
      expect(ALLOWED_MIME_TYPES).toContain('image/jpeg');
      expect(ALLOWED_MIME_TYPES).toContain('image/png');
      expect(ALLOWED_MIME_TYPES).toContain('image/webp');
      expect(ALLOWED_MIME_TYPES).toContain('image/gif');
      expect(ALLOWED_MIME_TYPES.length).toBe(4);
    });
  });
});
