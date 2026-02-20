/**
 * Client-side image compression utility
 *
 * Compresses and converts images to WebP format using the Canvas API.
 * No external dependencies required.
 */

export interface CompressionOptions {
  /** Max dimension (width or height) in pixels. Default: 2000 */
  maxDimension?: number;
  /** Quality 0–1. Default: 0.85 (excellent quality, ~60-70% smaller) */
  quality?: number;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  ratio: number;
}

/**
 * Compress and convert an image file to WebP.
 * Falls back to the original file if WebP is not supported.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const { maxDimension = 2000, quality = 0.85 } = options;

  const originalSize = file.size;

  const compressed = await new Promise<File>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down proportionally if needed
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback: return original
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const compressedFile = new File([blob], `${baseName}.webp`, {
            type: 'image/webp',
          });

          resolve(compressedFile);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de lire l'image"));
    };

    img.src = url;
  });

  return {
    file: compressed,
    originalSize,
    compressedSize: compressed.size,
    ratio: compressed.size / originalSize,
  };
}

/** Format bytes to a readable string */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
