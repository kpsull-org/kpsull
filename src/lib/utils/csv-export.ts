/**
 * CSV Export Utilities
 *
 * Utilities for generating CSV files from sales data.
 * Used for PRO plan export feature.
 */

/**
 * Represents a single sale record for CSV export
 */
export interface SaleRecord {
  /** Order date in ISO format */
  date: Date | string;
  /** Product name */
  productName: string;
  /** Quantity sold */
  quantity: number;
  /** Amount in cents */
  amount: number;
  /** Customer name */
  customerName: string;
}

/**
 * CSV Export options
 */
export interface CsvExportOptions {
  /** Delimiter character (default: ';' for French Excel compatibility) */
  delimiter?: string;
  /** Include BOM for UTF-8 Excel compatibility */
  includeBom?: boolean;
}

const DEFAULT_OPTIONS: Required<CsvExportOptions> = {
  delimiter: ';',
  includeBom: true,
};

/**
 * Format a date to French locale string (DD/MM/YYYY)
 */
function formatDateForCsv(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Format amount from cents to euros with French locale
 */
function formatAmountForCsv(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

/**
 * Escape a CSV field value
 * - Wrap in quotes if contains delimiter, newline, or quotes
 * - Double any quotes inside the field
 */
function escapeCsvField(value: string, delimiter: string): string {
  const needsQuotes =
    value.includes(delimiter) ||
    value.includes('\n') ||
    value.includes('\r') ||
    value.includes('"');

  if (needsQuotes) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

/**
 * CSV Headers for sales export
 */
const CSV_HEADERS = ['Date', 'Produit', 'Quantite', 'Montant', 'Client'];

/**
 * Generate CSV content from sales records
 *
 * @param records - Array of sale records to export
 * @param options - CSV export options
 * @returns CSV content as string
 *
 * @example
 * ```typescript
 * const csv = generateCsvContent([
 *   {
 *     date: new Date(),
 *     productName: 'T-Shirt',
 *     quantity: 2,
 *     amount: 2500, // 25.00 EUR
 *     customerName: 'Jean Dupont'
 *   }
 * ]);
 * ```
 */
export function generateCsvContent(
  records: SaleRecord[],
  options?: CsvExportOptions
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { delimiter, includeBom } = opts;

  // Build header row
  const headerRow = CSV_HEADERS.map((h) => escapeCsvField(h, delimiter)).join(delimiter);

  // Build data rows
  const dataRows = records.map((record) => {
    const fields = [
      formatDateForCsv(record.date),
      escapeCsvField(record.productName, delimiter),
      record.quantity.toString(),
      formatAmountForCsv(record.amount),
      escapeCsvField(record.customerName, delimiter),
    ];
    return fields.join(delimiter);
  });

  // Combine with newlines
  const content = [headerRow, ...dataRows].join('\r\n');

  // Add BOM for UTF-8 Excel compatibility
  if (includeBom) {
    return '\uFEFF' + content;
  }

  return content;
}

/**
 * Generate a filename for the export
 *
 * @param startDate - Start date of the export period
 * @param endDate - End date of the export period
 * @returns Formatted filename
 *
 * @example
 * ```typescript
 * const filename = generateExportFilename(
 *   new Date('2024-01-01'),
 *   new Date('2024-01-31')
 * );
 * // Returns: "ventes_01-01-2024_31-01-2024.csv"
 * ```
 */
export function generateExportFilename(startDate: Date, endDate: Date): string {
  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
      .format(d)
      .replace(/\//g, '-');

  return `ventes_${formatDate(startDate)}_${formatDate(endDate)}.csv`;
}

/**
 * Period presets for export
 */
export type ExportPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

/**
 * Get date range for a given period preset
 *
 * @param period - The period preset
 * @returns Start and end dates for the period
 */
export function getDateRangeForPeriod(period: ExportPeriod): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (period) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      return { start, end };
    }
    case 'week': {
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday as first day
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff, 0, 0, 0, 0);
      return { start, end };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return { start, end };
    }
    case 'quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), quarter * 3, 1, 0, 0, 0, 0);
      return { start, end };
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      return { start, end };
    }
    case 'custom':
    default: {
      // Default to current month for custom (user will provide dates)
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return { start, end };
    }
  }
}

/**
 * Labels for export periods (French)
 */
export const EXPORT_PERIOD_LABELS: Record<ExportPeriod, string> = {
  today: "Aujourd'hui",
  week: 'Cette semaine',
  month: 'Ce mois',
  quarter: 'Ce trimestre',
  year: 'Cette annee',
  custom: 'Periode personnalisee',
};
