import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import type { CsvExportOptions } from '@/lib/utils/csv-export';

/**
 * Data types available for admin export
 */
type AdminExportDataType = 'creators' | 'orders' | 'revenue';

/**
 * Creator record for CSV export
 */
interface CreatorRecord {
  id: string;
  name: string;
  email: string;
  brandName: string;
  siret: string;
  plan: string;
  status: string;
  createdAt: Date;
  productsCount: number;
  ordersCount: number;
  totalRevenue: number;
}

/**
 * Order record for CSV export
 */
interface OrderRecord {
  orderNumber: string;
  creatorName: string;
  customerName: string;
  customerEmail: string;
  status: string;
  totalAmount: number;
  createdAt: Date;
  shippedAt: Date | null;
  deliveredAt: Date | null;
}

/**
 * Revenue record for CSV export
 */
interface RevenueRecord {
  date: string;
  creatorName: string;
  ordersCount: number;
  totalRevenue: number;
  averageOrderValue: number;
}

const DEFAULT_CSV_OPTIONS: Required<CsvExportOptions> = {
  delimiter: ';',
  includeBom: true,
};

/**
 * Escape a CSV field value
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
 * Format a date to French locale string (DD/MM/YYYY)
 */
function formatDateForCsv(date: Date | null): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
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
 * Generate CSV content for creators export
 */
function generateCreatorsCsv(records: CreatorRecord[]): string {
  const { delimiter, includeBom } = DEFAULT_CSV_OPTIONS;

  const headers = [
    'ID',
    'Nom',
    'Email',
    'Marque',
    'SIRET',
    'Plan',
    'Statut',
    'Date inscription',
    'Produits',
    'Commandes',
    'CA Total',
  ];

  const headerRow = headers.map((h) => escapeCsvField(h, delimiter)).join(delimiter);

  const dataRows = records.map((record) => {
    const fields = [
      record.id,
      escapeCsvField(record.name, delimiter),
      escapeCsvField(record.email, delimiter),
      escapeCsvField(record.brandName, delimiter),
      record.siret,
      record.plan,
      record.status,
      formatDateForCsv(record.createdAt),
      record.productsCount.toString(),
      record.ordersCount.toString(),
      formatAmountForCsv(record.totalRevenue),
    ];
    return fields.join(delimiter);
  });

  const content = [headerRow, ...dataRows].join('\r\n');
  return includeBom ? '\uFEFF' + content : content;
}

/**
 * Generate CSV content for orders export
 */
function generateOrdersCsv(records: OrderRecord[]): string {
  const { delimiter, includeBom } = DEFAULT_CSV_OPTIONS;

  const headers = [
    'Numero commande',
    'Createur',
    'Client',
    'Email client',
    'Statut',
    'Montant',
    'Date creation',
    'Date expedition',
    'Date livraison',
  ];

  const headerRow = headers.map((h) => escapeCsvField(h, delimiter)).join(delimiter);

  const dataRows = records.map((record) => {
    const fields = [
      record.orderNumber,
      escapeCsvField(record.creatorName, delimiter),
      escapeCsvField(record.customerName, delimiter),
      escapeCsvField(record.customerEmail, delimiter),
      record.status,
      formatAmountForCsv(record.totalAmount),
      formatDateForCsv(record.createdAt),
      formatDateForCsv(record.shippedAt),
      formatDateForCsv(record.deliveredAt),
    ];
    return fields.join(delimiter);
  });

  const content = [headerRow, ...dataRows].join('\r\n');
  return includeBom ? '\uFEFF' + content : content;
}

/**
 * Generate CSV content for revenue export
 */
function generateRevenueCsv(records: RevenueRecord[]): string {
  const { delimiter, includeBom } = DEFAULT_CSV_OPTIONS;

  const headers = [
    'Date',
    'Createur',
    'Nombre commandes',
    'CA Total',
    'Panier moyen',
  ];

  const headerRow = headers.map((h) => escapeCsvField(h, delimiter)).join(delimiter);

  const dataRows = records.map((record) => {
    const fields = [
      record.date,
      escapeCsvField(record.creatorName, delimiter),
      record.ordersCount.toString(),
      formatAmountForCsv(record.totalRevenue),
      formatAmountForCsv(record.averageOrderValue),
    ];
    return fields.join(delimiter);
  });

  const content = [headerRow, ...dataRows].join('\r\n');
  return includeBom ? '\uFEFF' + content : content;
}

/**
 * Generate filename for admin export
 */
function generateAdminExportFilename(
  dataType: AdminExportDataType,
  startDate: Date,
  endDate: Date
): string {
  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
      .format(d)
      .replace(/\//g, '-');

  const typeLabels: Record<AdminExportDataType, string> = {
    creators: 'createurs',
    orders: 'commandes',
    revenue: 'chiffre-affaires',
  };

  return `admin_${typeLabels[dataType]}_${formatDate(startDate)}_${formatDate(endDate)}.csv`;
}

/**
 * Fetch creators data for export
 */
async function fetchCreatorsData(startDate: Date, endDate: Date): Promise<CreatorRecord[]> {
  const creators = await prisma.user.findMany({
    where: {
      role: 'CREATOR',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      accounts: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const records: CreatorRecord[] = [];

  for (const creator of creators) {
    // Get onboarding info
    const onboarding = await prisma.creatorOnboarding.findUnique({
      where: { userId: creator.id },
    });

    // Get subscription
    const subscription = await prisma.subscription.findFirst({
      where: { userId: creator.id },
    });

    // Get products count
    const productsCount = await prisma.product.count({
      where: { creatorId: creator.id },
    });

    // Get orders count and revenue
    const orders = await prisma.order.findMany({
      where: { creatorId: creator.id },
      select: { totalAmount: true },
    });

    const ordersCount = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    records.push({
      id: creator.id,
      name: creator.name ?? '',
      email: creator.email,
      brandName: onboarding?.brandName ?? '',
      siret: onboarding?.siret ?? '',
      plan: subscription?.plan ?? 'ESSENTIEL',
      status: subscription?.status ?? 'ACTIVE',
      createdAt: creator.createdAt,
      productsCount,
      ordersCount,
      totalRevenue,
    });
  }

  return records;
}

/**
 * Fetch orders data for export
 */
async function fetchOrdersData(startDate: Date, endDate: Date): Promise<OrderRecord[]> {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const records: OrderRecord[] = [];

  for (const order of orders) {
    // Get creator name
    const creator = await prisma.user.findUnique({
      where: { id: order.creatorId },
      select: { name: true },
    });

    records.push({
      orderNumber: order.orderNumber,
      creatorName: creator?.name ?? 'Inconnu',
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
    });
  }

  return records;
}

/**
 * Fetch revenue data for export (aggregated by creator and date)
 */
async function fetchRevenueData(startDate: Date, endDate: Date): Promise<RevenueRecord[]> {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        notIn: ['PENDING', 'CANCELED', 'REFUNDED'],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Group orders by creator and month
  const groupedData = new Map<string, {
    creatorId: string;
    creatorName: string;
    month: string;
    ordersCount: number;
    totalRevenue: number;
  }>();

  for (const order of orders) {
    const month = new Intl.DateTimeFormat('fr-FR', {
      month: '2-digit',
      year: 'numeric',
    }).format(order.createdAt);

    const key = `${order.creatorId}_${month}`;

    if (!groupedData.has(key)) {
      // Get creator name
      const creator = await prisma.user.findUnique({
        where: { id: order.creatorId },
        select: { name: true },
      });

      groupedData.set(key, {
        creatorId: order.creatorId,
        creatorName: creator?.name ?? 'Inconnu',
        month,
        ordersCount: 0,
        totalRevenue: 0,
      });
    }

    const data = groupedData.get(key);
    if (data) {
      data.ordersCount += 1;
      data.totalRevenue += order.totalAmount;
    }
  }

  return Array.from(groupedData.values()).map((data) => ({
    date: data.month,
    creatorName: data.creatorName,
    ordersCount: data.ordersCount,
    totalRevenue: data.totalRevenue,
    averageOrderValue: data.ordersCount > 0 ? Math.round(data.totalRevenue / data.ordersCount) : 0,
  }));
}

/**
 * GET /api/admin/export
 *
 * Export platform statistics as CSV for admin users.
 *
 * Query Parameters:
 * - dataType: 'creators' | 'orders' | 'revenue' (required)
 * - startDate: string (required) - ISO date string for period start
 * - endDate: string (required) - ISO date string for period end
 *
 * Returns:
 * - 200: CSV file download
 * - 400: Missing required parameters
 * - 401: Not authenticated
 * - 403: Not authorized (not admin)
 * - 500: Server error
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acces reserve aux administrateurs' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get('dataType') as AdminExportDataType | null;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    // Validate required parameters
    if (!dataType || !startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'Parametres manquants: dataType, startDate, endDate requis' },
        { status: 400 }
      );
    }

    // Validate data type
    const validDataTypes: AdminExportDataType[] = ['creators', 'orders', 'revenue'];
    if (!validDataTypes.includes(dataType)) {
      return NextResponse.json(
        { error: 'Type de donnees invalide. Valeurs acceptees: creators, orders, revenue' },
        { status: 400 }
      );
    }

    // Parse dates
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Dates invalides' }, { status: 400 });
    }

    // Fetch data and generate CSV based on data type
    let csvContent: string;

    switch (dataType) {
      case 'creators': {
        const records = await fetchCreatorsData(startDate, endDate);
        csvContent = generateCreatorsCsv(records);
        break;
      }
      case 'orders': {
        const records = await fetchOrdersData(startDate, endDate);
        csvContent = generateOrdersCsv(records);
        break;
      }
      case 'revenue': {
        const records = await fetchRevenueData(startDate, endDate);
        csvContent = generateRevenueCsv(records);
        break;
      }
    }

    // Generate filename
    const filename = generateAdminExportFilename(dataType, startDate, endDate);

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Admin export error:', error);
    return NextResponse.json({ error: 'Erreur lors de lexport' }, { status: 500 });
  }
}
