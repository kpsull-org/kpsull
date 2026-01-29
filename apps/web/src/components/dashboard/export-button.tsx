'use client';

import { useState, useCallback } from 'react';
import { Download, Lock, Calendar, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  ExportPeriod,
  EXPORT_PERIOD_LABELS,
  getDateRangeForPeriod,
} from '@/lib/utils/csv-export';

export interface ExportButtonProps {
  /** Whether the user has PRO plan */
  isPro: boolean;
  /** Creator ID for the export */
  creatorId: string;
  /** Optional className for styling */
  className?: string;
}

/**
 * ExportButton
 *
 * Export button component for downloading sales data as CSV.
 * PRO users can select a period and download the file.
 * FREE users see a disabled button with upgrade tooltip.
 *
 * @example
 * ```tsx
 * <ExportButton
 *   isPro={true}
 *   creatorId="creator_123"
 * />
 * ```
 */
export function ExportButton({ isPro, creatorId, className }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<ExportPeriod>('month');

  const handleExport = useCallback(async () => {
    if (!isPro) return;

    setIsLoading(true);

    try {
      const { start, end } = getDateRangeForPeriod(selectedPeriod);

      const params = new URLSearchParams({
        creatorId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });

      const response = await fetch(`/api/dashboard/export?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(errorData.error || 'Export failed');
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'ventes.csv';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
        if (match?.[1]) {
          filename = match[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      // Could add toast notification here
    } finally {
      setIsLoading(false);
    }
  }, [isPro, creatorId, selectedPeriod]);

  const periods: ExportPeriod[] = ['today', 'week', 'month', 'quarter', 'year'];

  // Disabled state for FREE users
  if (!isPro) {
    return (
      <div className={cn('relative group', className)}>
        <Button variant="outline" disabled className="gap-2">
          <Lock className="h-4 w-4" />
          Exporter CSV
        </Button>
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          Disponible avec PRO
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Exporter CSV
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
        />
      </Button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <Card className="absolute top-full right-0 mt-2 z-50 w-64 shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Periode</span>
              </div>

              <div className="space-y-1">
                {periods.map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm rounded-md transition-colors',
                      selectedPeriod === period
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    {EXPORT_PERIOD_LABELS[period]}
                  </button>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t">
                <Button
                  onClick={handleExport}
                  className="w-full gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Telecharger
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
