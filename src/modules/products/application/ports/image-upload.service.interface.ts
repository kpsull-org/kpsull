import { Result } from '@/shared/domain';

/**
 * Interface for Image Upload Service
 *
 * Defines the contract for uploading and deleting images.
 * Implementations can use MinIO, S3, or other storage backends.
 */
export interface ImageUploadService {
  /**
   * Upload a file to storage
   *
   * @param file - The file buffer to upload
   * @param filename - The original filename (used to determine content type)
   * @returns Result containing the URL of the uploaded file
   */
  upload(file: Buffer, filename: string): Promise<Result<string>>;

  /**
   * Delete a file from storage
   *
   * @param url - The URL of the file to delete
   * @returns Result indicating success or failure
   */
  delete(url: string): Promise<Result<void>>;
}
