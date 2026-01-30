'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface UsageProgressProps {
  label: string;
  current: number;
  limit: number; // -1 for unlimited
  unit?: string;
}

export function UsageProgress({
  label,
  current,
  limit,
  unit = '',
}: UsageProgressProps) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && current >= limit;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span
          className={cn(
            isAtLimit && 'text-destructive font-medium',
            isNearLimit && !isAtLimit && 'text-orange-500'
          )}
        >
          {current}
          {unit} / {isUnlimited ? '∞' : `${limit}${unit}`}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={percentage}
          className={cn(
            'h-2',
            isAtLimit && '[&>[data-slot=indicator]]:bg-destructive',
            isNearLimit &&
              !isAtLimit &&
              '[&>[data-slot=indicator]]:bg-orange-500'
          )}
        />
      )}
      {isUnlimited && (
        <div className="h-2 rounded-full bg-muted flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground">Illimité</span>
        </div>
      )}
    </div>
  );
}
