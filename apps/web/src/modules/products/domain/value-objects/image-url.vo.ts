import { ValueObject, Result } from '@/shared/domain';

export type ImageUrlType = 'product' | 'variant' | 'project';

interface ImageUrlProps {
  url: string;
  type: ImageUrlType;
}

/**
 * ImageUrl Value Object
 *
 * Represents a validated image URL that can be either:
 * - An external HTTPS URL (e.g., https://cdn.example.com/image.jpg)
 * - A local upload path (e.g., /uploads/products/123/image.jpg)
 */
export class ImageUrl extends ValueObject<ImageUrlProps> {
  private constructor(props: ImageUrlProps) {
    super(props);
  }

  get url(): string {
    return this.props.url;
  }

  get type(): ImageUrlType {
    return this.props.type;
  }

  get isExternal(): boolean {
    return this.props.url.startsWith('https://');
  }

  get isLocal(): boolean {
    return this.props.url.startsWith('/uploads/');
  }

  /**
   * Create an ImageUrl with validation
   *
   * @param url - The image URL (must start with https:// or /uploads/)
   * @param type - The type of image (product, variant, or project)
   */
  static create(url: string, type: ImageUrlType): Result<ImageUrl> {
    if (!url || !url.trim()) {
      return Result.fail("L'URL de l'image est requise");
    }

    const trimmedUrl = url.trim();

    // Validate URL format
    const isHttps = trimmedUrl.startsWith('https://');
    const isLocalUpload = trimmedUrl.startsWith('/uploads/');

    if (!isHttps && !isLocalUpload) {
      return Result.fail(
        "L'URL doit commencer par https:// ou /uploads/"
      );
    }

    return Result.ok(new ImageUrl({ url: trimmedUrl, type }));
  }

  /**
   * Reconstitute an ImageUrl from persistence without validation
   * Used when loading from database where data is already validated
   */
  static reconstitute(url: string, type: ImageUrlType): ImageUrl {
    return new ImageUrl({ url, type });
  }
}
