/**
 * File validation utilities for image uploads.
 *
 * Validates files based on:
 * - File size limits
 * - File extension allowlist
 * - MIME type verification via magic bytes (file signatures)
 */

import { Result } from '@/shared/domain';

/** Maximum allowed file size in bytes (10 MB) */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Allowed MIME types for image uploads */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

/** Allowed file extensions for image uploads */
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/**
 * Detects the MIME type of a file based on its magic bytes.
 *
 * @param buffer - The file content as a Buffer
 * @returns The detected MIME type, or null if not recognized
 */
export function detectMimeType(buffer: Buffer): AllowedMimeType | null {
  if (buffer.length < 12) {
    return null;
  }

  // Check JPEG (FFD8FF)
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // Check PNG (89504E47 0D0A1A0A)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // Check GIF (GIF87a or GIF89a)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return 'image/gif';
  }

  // Check WebP (RIFF....WEBP)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

/**
 * Extracts the file extension from a filename.
 *
 * @param filename - The filename to extract extension from
 * @returns The lowercase extension including the dot (e.g., '.jpg'), or empty string if none
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return '';
  }
  return filename.slice(lastDotIndex).toLowerCase();
}

/**
 * Checks if a file extension is allowed.
 *
 * @param extension - The file extension to check (with or without leading dot)
 * @returns True if the extension is allowed
 */
export function isAllowedExtension(extension: string): boolean {
  const normalizedExt = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(normalizedExt);
}

/**
 * Validates an image file for upload.
 *
 * Performs the following validations:
 * 1. File size must not exceed MAX_FILE_SIZE (10 MB)
 * 2. File extension must be in ALLOWED_EXTENSIONS
 * 3. File content must match an allowed MIME type (verified via magic bytes)
 * 4. Extension must be consistent with detected MIME type
 *
 * @param buffer - The file content as a Buffer
 * @param filename - The original filename
 * @returns Result.ok() if valid, Result.fail() with error message if invalid
 */
export function validateImageFile(buffer: Buffer, filename: string): Result<void> {
  // Validate file is not empty
  if (!buffer || buffer.length === 0) {
    return Result.fail('Le fichier est vide');
  }

  // Validate file size
  if (buffer.length > MAX_FILE_SIZE) {
    const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
    const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    return Result.fail(`Le fichier est trop volumineux (${sizeMB} MB). Taille maximale: ${maxSizeMB} MB`);
  }

  // Validate filename
  if (!filename?.trim()) {
    return Result.fail('Le nom du fichier est requis');
  }

  // Validate extension
  const extension = getFileExtension(filename);
  if (!extension) {
    return Result.fail('Le fichier doit avoir une extension');
  }

  if (!isAllowedExtension(extension)) {
    return Result.fail(
      `Extension de fichier non autorisee: ${extension}. Extensions autorisees: ${ALLOWED_EXTENSIONS.join(', ')}`
    );
  }

  // Validate MIME type via magic bytes
  const detectedMimeType = detectMimeType(buffer);
  if (!detectedMimeType) {
    return Result.fail(
      `Type de fichier non reconnu. Types autorises: ${ALLOWED_MIME_TYPES.join(', ')}`
    );
  }

  // Validate extension matches detected MIME type
  const mimeToExtensions: Record<AllowedMimeType, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif'],
  };

  const validExtensions = mimeToExtensions[detectedMimeType];
  if (!validExtensions.includes(extension)) {
    return Result.fail(
      `L'extension du fichier (${extension}) ne correspond pas au contenu detecte (${detectedMimeType})`
    );
  }

  return Result.ok();
}

/**
 * Formats a file size in bytes to a human-readable string.
 *
 * @param bytes - The size in bytes
 * @returns A formatted string (e.g., "1.5 MB", "256 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
