'use client';

import { useState, useCallback } from 'react';
import { Download, Calendar, ChevronDown, Loader2, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  ExportPeriod,
  EXPORT_PERIOD_LABELS,
  getDateRangeForPeriod,
} from '@/lib/utils/csv-export';

/**
 * Data types available for admin export
 */
export type AdminExportDataType = 'creators' | 'orders' | 'revenue';

/**
 * Labels for admin export data types (French)
 */
export const ADMIN_EXPORT_DATA_TYPE_LABELS: Record<AdminExportDataType, string> = {
  creators: 'Createurs',
  orders: 'Commandes',
  revenue: 'Chiffre d\'affaires',
};

export interface AdminExportButtonProps {
  /** Optional className for styling */
  className?: string;
}

/**
 * AdminExportButton
 *
 * Export button component for downloading platform statistics as CSV.
 * Allows admin users to select a period and data type before downloading.
 *
 * @example
 * ```tsx
 * <AdminExportButton />
 * ```
 */
export function AdminExportButton({ className }: AdminExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<ExportPeriod>('month');
  const [selectedDataType, setSelectedDataType] = useState<AdminExportDataType>('orders');

  const handleExport = useCallback(async () => {
    setIsLoading(true);

    try {
      const { start, end } = getDateRangeForPeriod(selectedPeriod);

      const params = new URLSearchParams({
        dataType: selectedDataType,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });

      const response = await fetch(`/api/admin/export?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(errorData.error || 'Export failed');
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'export-admin.csv';
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
  }, [selectedPeriod, selectedDataType]);

  const periods: ExportPeriod[] = ['today', 'week', 'month', 'quarter', 'year'];
  const dataTypes: AdminExportDataType[] = ['creators', 'orders', 'revenue'];

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
        Exporter statistiques
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

          <Card className="absolute top-full right-0 mt-2 z-50 w-72 shadow-lg">
            <CardContent className="p-3">
              {/* Data Type Selection */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Type de donnees</span>
                </div>

                <div className="space-y-1">
                  {dataTypes.map((dataType) => (
                    <button
                      key={dataType}
                      onClick={() => setSelectedDataType(dataType)}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm rounded-md transition-colors',
                        selectedDataType === dataType
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      )}
                    >
                      {ADMIN_EXPORT_DATA_TYPE_LABELS[dataType]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Period Selection */}
              <div className="mb-4">
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
              </div>

              {/* Download Button */}
              <div className="pt-3 border-t">
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
