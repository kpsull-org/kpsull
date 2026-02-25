import { describe, it, expect } from 'vitest';
import { TimePeriod, TimePeriodType } from '../time-period.vo';

describe('TimePeriod Value Object', () => {
  describe('create', () => {
    it.each<TimePeriodType>([
      'TODAY',
      'LAST_7_DAYS',
      'LAST_30_DAYS',
      'LAST_90_DAYS',
      'THIS_MONTH',
      'LAST_MONTH',
      'THIS_YEAR',
      'CUSTOM',
    ])('should create %s period', (periodType) => {
      const result = TimePeriod.create(periodType);

      expect(result.isSuccess).toBe(true);
      expect(result.value?.value).toBe(periodType);
    });

    it('should fail with invalid period type', () => {
      const result = TimePeriod.create('INVALID' as TimePeriodType);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Type de periode invalide');
    });
  });

  describe('factory methods', () => {
    it('should create TODAY period', () => {
      const period = TimePeriod.today();

      expect(period.value).toBe('TODAY');
      expect(period.isToday).toBe(true);
    });

    it('should create LAST_7_DAYS period', () => {
      const period = TimePeriod.last7Days();

      expect(period.value).toBe('LAST_7_DAYS');
      expect(period.isLast7Days).toBe(true);
    });

    it('should create LAST_30_DAYS period', () => {
      const period = TimePeriod.last30Days();

      expect(period.value).toBe('LAST_30_DAYS');
      expect(period.isLast30Days).toBe(true);
    });

    it('should create LAST_90_DAYS period', () => {
      const period = TimePeriod.last90Days();

      expect(period.value).toBe('LAST_90_DAYS');
      expect(period.isLast90Days).toBe(true);
    });

    it('should create THIS_MONTH period', () => {
      const period = TimePeriod.thisMonth();

      expect(period.value).toBe('THIS_MONTH');
      expect(period.isThisMonth).toBe(true);
    });

    it('should create LAST_MONTH period', () => {
      const period = TimePeriod.lastMonth();

      expect(period.value).toBe('LAST_MONTH');
      expect(period.isLastMonth).toBe(true);
    });

    it('should create THIS_YEAR period', () => {
      const period = TimePeriod.thisYear();

      expect(period.value).toBe('THIS_YEAR');
      expect(period.isThisYear).toBe(true);
    });

    it('should create CUSTOM period with dates', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const period = TimePeriod.custom(startDate, endDate);

      expect(period.value).toBe('CUSTOM');
      expect(period.isCustom).toBe(true);
      expect(period.startDate).toEqual(startDate);
      expect(period.endDate).toEqual(endDate);
    });
  });

  describe('getDateRange', () => {
    it('should return date range for TODAY', () => {
      const period = TimePeriod.today();
      const { start, end } = period.getDateRange();

      const today = new Date();
      expect(start.toDateString()).toBe(today.toDateString());
      expect(end.toDateString()).toBe(today.toDateString());
    });

    it('should return date range for LAST_7_DAYS', () => {
      const period = TimePeriod.last7Days();
      const { start, end } = period.getDateRange();

      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      expect(start.toDateString()).toBe(sevenDaysAgo.toDateString());
      expect(end.toDateString()).toBe(today.toDateString());
    });

    it('should return date range for LAST_30_DAYS', () => {
      const period = TimePeriod.last30Days();
      const { start, end } = period.getDateRange();

      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      expect(start.toDateString()).toBe(thirtyDaysAgo.toDateString());
      expect(end.toDateString()).toBe(today.toDateString());
    });

    it('should return date range for LAST_90_DAYS', () => {
      const period = TimePeriod.last90Days();
      const { start, end } = period.getDateRange();

      const today = new Date();
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      expect(start.toDateString()).toBe(ninetyDaysAgo.toDateString());
      expect(end.toDateString()).toBe(today.toDateString());
    });

    it('should return date range for THIS_MONTH', () => {
      const period = TimePeriod.thisMonth();
      const { start, end } = period.getDateRange();

      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      expect(start.toDateString()).toBe(firstDayOfMonth.toDateString());
      expect(end.toDateString()).toBe(today.toDateString());
    });

    it('should return date range for LAST_MONTH', () => {
      const period = TimePeriod.lastMonth();
      const { start, end } = period.getDateRange();

      const today = new Date();
      const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

      expect(start.toDateString()).toBe(firstDayOfLastMonth.toDateString());
      expect(end.toDateString()).toBe(lastDayOfLastMonth.toDateString());
    });

    it('should return date range for THIS_YEAR', () => {
      const period = TimePeriod.thisYear();
      const { start, end } = period.getDateRange();

      const today = new Date();
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

      expect(start.toDateString()).toBe(firstDayOfYear.toDateString());
      expect(end.toDateString()).toBe(today.toDateString());
    });

    it('should return date range for CUSTOM', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const period = TimePeriod.custom(startDate, endDate);
      const { start, end } = period.getDateRange();

      expect(start.toDateString()).toBe(startDate.toDateString());
      expect(end.toDateString()).toBe(endDate.toDateString());
    });

    it('should fallback to today when CUSTOM period has no dates', () => {
      const period = TimePeriod.create('CUSTOM').value!;
      const { start, end } = period.getDateRange();

      const today = new Date();
      expect(start.toDateString()).toBe(today.toDateString());
      expect(end.toDateString()).toBe(today.toDateString());
    });
  });

  describe('getPreviousPeriod', () => {
    it('should return previous period for LAST_7_DAYS', () => {
      const period = TimePeriod.last7Days();
      const previous = period.getPreviousPeriod();

      const { start: currentStart } = period.getDateRange();
      const { end: prevEnd } = previous.getDateRange();

      // Previous period should end the day before current period starts
      const expectedPrevEnd = new Date(currentStart);
      expectedPrevEnd.setDate(expectedPrevEnd.getDate() - 1);

      expect(prevEnd.toDateString()).toBe(expectedPrevEnd.toDateString());
    });

    it('should return a CUSTOM previous period for TODAY', () => {
      const period = TimePeriod.today();
      const previous = period.getPreviousPeriod();

      // TODAY has start == end (1 day), so the previous period should also be 1 day ending yesterday
      const { start: currentStart } = period.getDateRange();
      const expectedPrevEnd = new Date(currentStart);
      expectedPrevEnd.setDate(expectedPrevEnd.getDate() - 1);

      const { end: prevEnd } = previous.getDateRange();
      expect(prevEnd.toDateString()).toBe(expectedPrevEnd.toDateString());
      expect(previous.isCustom).toBe(true);
    });
  });

  describe('equality', () => {
    it('should be equal to another TimePeriod with same value', () => {
      const period1 = TimePeriod.last7Days();
      const period2 = TimePeriod.last7Days();

      expect(period1.equals(period2)).toBe(true);
    });

    it('should not be equal to another TimePeriod with different value', () => {
      const period1 = TimePeriod.last7Days();
      const period2 = TimePeriod.last30Days();

      expect(period1.equals(period2)).toBe(false);
    });
  });
});
