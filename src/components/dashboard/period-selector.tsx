'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { TimePeriodType } from '@/modules/analytics/domain/value-objects';

/**
 * Period option configuration
 */
interface PeriodOption {
  value: TimePeriodType;
  label: string;
  shortLabel: string;
}

/**
 * Available period options for the selector
 */
const PERIOD_OPTIONS: PeriodOption[] = [
  { value: 'LAST_7_DAYS', label: '7 jours', shortLabel: '7j' },
  { value: 'LAST_30_DAYS', label: '30 jours', shortLabel: '30j' },
  { value: 'LAST_90_DAYS', label: '90 jours', shortLabel: '90j' },
  { value: 'THIS_YEAR', label: '12 mois', shortLabel: '12m' },
];

export interface PeriodSelectorProps {
  /** Currently selected period */
  selectedPeriod: TimePeriodType;
  /** Callback when period changes */
  onPeriodChange: (period: TimePeriodType) => void;
  /** Optional className for styling */
  className?: string;
  /** Whether to use compact labels on mobile */
  compact?: boolean;
}

/**
 * PeriodSelector
 *
 * Button group for selecting time periods in analytics dashboards.
 * Supports 7 days, 30 days, 90 days, and 12 months (THIS_YEAR).
 *
 * @example
 * ```tsx
 * const [period, setPeriod] = useState<TimePeriodType>('LAST_30_DAYS');
 *
 * <PeriodSelector
 *   selectedPeriod={period}
 *   onPeriodChange={setPeriod}
 * />
 * ```
 */
export function PeriodSelector({
  selectedPeriod,
  onPeriodChange,
  className,
  compact = false,
}: PeriodSelectorProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border bg-muted p-1',
        className
      )}
      role="group"
      aria-label="Selectionner une periode"
    >
      {PERIOD_OPTIONS.map((option) => {
        const isSelected = selectedPeriod === option.value;

        return (
          <Button
            key={option.value}
            variant={isSelected ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onPeriodChange(option.value)}
            className={cn(
              'min-w-[3rem] px-3 text-xs font-medium transition-all',
              isSelected
                ? 'bg-background text-foreground shadow-sm hover:bg-background'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-pressed={isSelected}
            aria-label={`Afficher les donnees des ${option.label}`}
          >
            <span className={cn(compact ? 'sm:hidden' : 'hidden')}>
              {option.shortLabel}
            </span>
            <span className={cn(compact ? 'hidden sm:inline' : 'inline')}>
              {option.label}
            </span>
          </Button>
        );
      })}
    </div>
  );
}

/**
 * Export period options for use in other components
 */
export { PERIOD_OPTIONS };
export type { PeriodOption };
