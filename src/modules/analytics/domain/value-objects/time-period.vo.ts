import { ValueObject, Result } from '@/shared/domain';

export type TimePeriodType =
  | 'TODAY'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'LAST_90_DAYS'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'THIS_YEAR'
  | 'CUSTOM';

interface TimePeriodProps {
  value: TimePeriodType;
  startDate?: Date;
  endDate?: Date;
}

/**
 * TimePeriod Value Object
 *
 * Represents a time period for analytics queries.
 * Supports predefined periods (TODAY, LAST_7_DAYS, etc.) and custom date ranges.
 */
export class TimePeriod extends ValueObject<TimePeriodProps> {
  private static readonly VALID_PERIODS: TimePeriodType[] = [
    'TODAY',
    'LAST_7_DAYS',
    'LAST_30_DAYS',
    'LAST_90_DAYS',
    'THIS_MONTH',
    'LAST_MONTH',
    'THIS_YEAR',
    'CUSTOM',
  ];

  private constructor(props: TimePeriodProps) {
    super(props);
  }

  get value(): TimePeriodType {
    return this.props.value;
  }

  get startDate(): Date | undefined {
    return this.props.startDate;
  }

  get endDate(): Date | undefined {
    return this.props.endDate;
  }

  get isToday(): boolean {
    return this.value === 'TODAY';
  }

  get isLast7Days(): boolean {
    return this.value === 'LAST_7_DAYS';
  }

  get isLast30Days(): boolean {
    return this.value === 'LAST_30_DAYS';
  }

  get isLast90Days(): boolean {
    return this.value === 'LAST_90_DAYS';
  }

  get isThisMonth(): boolean {
    return this.value === 'THIS_MONTH';
  }

  get isLastMonth(): boolean {
    return this.value === 'LAST_MONTH';
  }

  get isThisYear(): boolean {
    return this.value === 'THIS_YEAR';
  }

  get isCustom(): boolean {
    return this.value === 'CUSTOM';
  }

  /**
   * Creates a TimePeriod from a string value
   */
  static create(value: TimePeriodType): Result<TimePeriod> {
    if (!TimePeriod.VALID_PERIODS.includes(value)) {
      return Result.fail('Type de periode invalide');
    }

    return Result.ok(new TimePeriod({ value }));
  }

  /**
   * Factory method for TODAY period
   */
  static today(): TimePeriod {
    return new TimePeriod({ value: 'TODAY' });
  }

  /**
   * Factory method for LAST_7_DAYS period
   */
  static last7Days(): TimePeriod {
    return new TimePeriod({ value: 'LAST_7_DAYS' });
  }

  /**
   * Factory method for LAST_30_DAYS period
   */
  static last30Days(): TimePeriod {
    return new TimePeriod({ value: 'LAST_30_DAYS' });
  }

  /**
   * Factory method for LAST_90_DAYS period
   */
  static last90Days(): TimePeriod {
    return new TimePeriod({ value: 'LAST_90_DAYS' });
  }

  /**
   * Factory method for THIS_MONTH period
   */
  static thisMonth(): TimePeriod {
    return new TimePeriod({ value: 'THIS_MONTH' });
  }

  /**
   * Factory method for LAST_MONTH period
   */
  static lastMonth(): TimePeriod {
    return new TimePeriod({ value: 'LAST_MONTH' });
  }

  /**
   * Factory method for THIS_YEAR period
   */
  static thisYear(): TimePeriod {
    return new TimePeriod({ value: 'THIS_YEAR' });
  }

  /**
   * Factory method for CUSTOM period with specific dates
   */
  static custom(startDate: Date, endDate: Date): TimePeriod {
    return new TimePeriod({
      value: 'CUSTOM',
      startDate,
      endDate,
    });
  }

  /**
   * Returns the date range for this period
   */
  getDateRange(): { start: Date; end: Date } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (this.value) {
      case 'TODAY': {
        return { start: today, end: today };
      }
      case 'LAST_7_DAYS': {
        const start = new Date(today);
        start.setDate(start.getDate() - 7);
        return { start, end: today };
      }
      case 'LAST_30_DAYS': {
        const start = new Date(today);
        start.setDate(start.getDate() - 30);
        return { start, end: today };
      }
      case 'LAST_90_DAYS': {
        const start = new Date(today);
        start.setDate(start.getDate() - 90);
        return { start, end: today };
      }
      case 'THIS_MONTH': {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start, end: today };
      }
      case 'LAST_MONTH': {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        return { start, end };
      }
      case 'THIS_YEAR': {
        const start = new Date(today.getFullYear(), 0, 1);
        return { start, end: today };
      }
      case 'CUSTOM': {
        return {
          start: this.props.startDate ?? today,
          end: this.props.endDate ?? today,
        };
      }
      default: {
        return { start: today, end: today };
      }
    }
  }

  /**
   * Returns the previous period of the same duration
   * Useful for comparing metrics with previous period
   */
  getPreviousPeriod(): TimePeriod {
    const { start, end } = this.getDateRange();
    const duration = end.getTime() - start.getTime();
    const daysInPeriod = Math.ceil(duration / (1000 * 60 * 60 * 24)) + 1;

    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);

    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - daysInPeriod + 1);

    return TimePeriod.custom(prevStart, prevEnd);
  }
}
