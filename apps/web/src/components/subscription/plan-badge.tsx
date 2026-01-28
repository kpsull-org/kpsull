'use client';

import { Badge } from '@/components/ui/badge';
import { Crown, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlanType } from '@/modules/subscriptions/domain/value-objects/plan.vo';

interface PlanBadgeProps {
  plan: PlanType;
  size?: 'sm' | 'md' | 'lg';
}

export function PlanBadge({ plan, size = 'md' }: PlanBadgeProps) {
  const isPro = plan === 'PRO';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <Badge
      variant={isPro ? 'default' : 'secondary'}
      className={cn(
        sizeClasses[size],
        isPro && 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
      )}
    >
      {isPro ? (
        <Crown className={cn(iconSizes[size], 'mr-1')} />
      ) : (
        <Star className={cn(iconSizes[size], 'mr-1')} />
      )}
      {plan}
    </Badge>
  );
}
