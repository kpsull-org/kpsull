import { ValueObject } from '@/shared/domain/value-object.base';
import { Result } from '@/shared/domain/result';

interface RatingProps {
  value: number;
}

/**
 * Rating Value Object
 *
 * Represents a star rating from 1 to 5.
 * Provides helper methods for quality indicators and star representation.
 */
export class Rating extends ValueObject<RatingProps> {
  private static readonly MIN_RATING = 1;
  private static readonly MAX_RATING = 5;
  private static readonly POSITIVE_THRESHOLD = 4;
  private static readonly NEGATIVE_THRESHOLD = 2;

  private constructor(props: RatingProps) {
    super(props);
  }

  /**
   * Creates a new Rating value object
   * @param rating - The numeric rating between 1 and 5
   * @returns Result containing Rating or error message
   */
  static create(rating: number): Result<Rating> {
    if (!Number.isInteger(rating)) {
      return Result.fail('La note doit etre un entier');
    }

    if (rating < Rating.MIN_RATING || rating > Rating.MAX_RATING) {
      return Result.fail(`La note doit etre entre 1 et 5`);
    }

    return Result.ok(new Rating({ value: rating }));
  }

  /**
   * The numeric rating value (1-5)
   */
  get value(): number {
    return this.props.value;
  }

  /**
   * Whether this is a 1-star rating
   */
  get isOneStar(): boolean {
    return this.props.value === 1;
  }

  /**
   * Whether this is a 2-star rating
   */
  get isTwoStars(): boolean {
    return this.props.value === 2;
  }

  /**
   * Whether this is a 3-star rating
   */
  get isThreeStars(): boolean {
    return this.props.value === 3;
  }

  /**
   * Whether this is a 4-star rating
   */
  get isFourStars(): boolean {
    return this.props.value === 4;
  }

  /**
   * Whether this is a 5-star rating
   */
  get isFiveStars(): boolean {
    return this.props.value === 5;
  }

  /**
   * Whether this is a positive rating (4-5 stars)
   */
  get isPositive(): boolean {
    return this.props.value >= Rating.POSITIVE_THRESHOLD;
  }

  /**
   * Whether this is a negative rating (1-2 stars)
   */
  get isNegative(): boolean {
    return this.props.value <= Rating.NEGATIVE_THRESHOLD;
  }

  /**
   * Whether this is a neutral rating (3 stars)
   */
  get isNeutral(): boolean {
    return !this.isPositive && !this.isNegative;
  }

  /**
   * Returns the string representation of the rating
   */
  override toString(): string {
    return `${this.value}/5`;
  }
}
