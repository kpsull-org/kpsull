'use client';

import { Input } from '@/components/ui/input';
import type { SizeEntry } from '@/lib/utils/parse-sizes';

interface ShippingDimensionsTableProps {
  sizes: SizeEntry[];
  onChange: (idx: number, field: 'weight' | 'width' | 'height' | 'length', value: string) => void;
  onBlur?: () => void;
}

export function ShippingDimensionsTable({ sizes, onChange, onBlur }: ShippingDimensionsTableProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr] gap-2 px-1">
        <span className="text-xs font-medium text-muted-foreground">Taille</span>
        <span className="text-xs font-medium text-muted-foreground">Poids (g)</span>
        <span className="text-xs font-medium text-muted-foreground">Larg. (cm)</span>
        <span className="text-xs font-medium text-muted-foreground">Haut. (cm)</span>
        <span className="text-xs font-medium text-muted-foreground">Long. (cm)</span>
      </div>
      {sizes.map((entry, idx) => (
        <div key={entry.size || idx} className="grid grid-cols-[60px_1fr_1fr_1fr_1fr] gap-2 items-center">
          <span className="text-xs font-medium truncate">{entry.size || '—'}</span>
          <Input
            type="number"
            min="0"
            value={entry.weight ?? ''}
            onChange={(e) => onChange(idx, 'weight', e.target.value)}
            onBlur={onBlur}
            placeholder="300"
            className="h-8 text-sm"
          />
          <Input
            type="number"
            min="0"
            step="0.1"
            value={entry.width ?? ''}
            onChange={(e) => onChange(idx, 'width', e.target.value)}
            onBlur={onBlur}
            placeholder="30"
            className="h-8 text-sm"
          />
          <Input
            type="number"
            min="0"
            step="0.1"
            value={entry.height ?? ''}
            onChange={(e) => onChange(idx, 'height', e.target.value)}
            onBlur={onBlur}
            placeholder="40"
            className="h-8 text-sm"
          />
          <Input
            type="number"
            min="0"
            step="0.1"
            value={entry.length ?? ''}
            onChange={(e) => onChange(idx, 'length', e.target.value)}
            onBlur={onBlur}
            placeholder="5"
            className="h-8 text-sm"
          />
        </div>
      ))}
    </div>
  );
}
