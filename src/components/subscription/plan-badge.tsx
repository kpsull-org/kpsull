'use client';

import { Badge } from '@/components/ui/badge';
import { Crown, Star, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlanType } from '@/modules/subscriptions/domain/value-objects/plan.vo';

interface PlanBadgeProps {
  plan: PlanType;
  size?: 'sm' | 'md' | 'lg';
}

const planConfig: Record<
  PlanType,
  { icon: typeof Star; className: string; label: string }
> = {
  ESSENTIEL: {
    icon: Star,
    className: 'bg-blue-500 hover:bg-blue-600',
    label: 'Essentiel',
  },
  STUDIO: {
    icon: Gem,
    className: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
    label: 'Studio',
  },
  ATELIER: {
    icon: Crown,
    className: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
    label: 'Atelier',
  },
};

export function PlanBadge({ plan, size = 'md' }: PlanBadgeProps) {
  const config = planConfig[plan];
  const Icon = config.icon;

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
    <Badge className={cn(sizeClasses[size], config.className, 'text-white')}>
      <Icon className={cn(iconSizes[size], 'mr-1')} />
      {config.label}
    </Badge>
  );
}
