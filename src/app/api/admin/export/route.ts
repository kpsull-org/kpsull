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
 * Fetch creators data for export — batch queries (no N+1)
 */
async function fetchCreatorsData(startDate: Date, endDate: Date): Promise<CreatorRecord[]> {
  const creators = await prisma.user.findMany({
    where: { role: 'CREATOR', createdAt: { gte: startDate, lte: endDate } },
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  if (creators.length === 0) return [];

  const creatorIds = creators.map((c) => c.id);

  // Batch load all related data in parallel
  const [onboardings, subscriptions, productCounts, orderAggregates] = await Promise.all([
    prisma.creatorOnboarding.findMany({
      where: { userId: { in: creatorIds } },
      select: { userId: true, brandName: true, siret: true },
    }),
    prisma.subscription.findMany({
      where: { userId: { in: creatorIds } },
      select: { userId: true, plan: true, status: true },
    }),
    prisma.product.groupBy({
      by: ['creatorId'],
      where: { creatorId: { in: creatorIds } },
      _count: { id: true },
    }),
    prisma.order.groupBy({
      by: ['creatorId'],
      where: { creatorId: { in: creatorIds } },
      _count: { id: true },
      _sum: { totalAmount: true },
    }),
  ]);

  // Build lookup maps for O(1) access
  const onboardingMap = new Map(onboardings.map((o) => [o.userId, o]));
  const subscriptionMap = new Map(subscriptions.map((s) => [s.userId, s]));
  const productCountMap = new Map(productCounts.map((p) => [p.creatorId, p._count.id]));
  const orderMap = new Map(
    orderAggregates.map((o) => [o.creatorId, { count: o._count.id, revenue: o._sum.totalAmount ?? 0 }])
  );

  return creators.map((creator) => {
    const onboarding = onboardingMap.get(creator.id);
    const subscription = subscriptionMap.get(creator.id);
    const orderData = orderMap.get(creator.id);
    return {
      id: creator.id,
      name: creator.name ?? '',
      email: creator.email,
      brandName: onboarding?.brandName ?? '',
      siret: onboarding?.siret ?? '',
      plan: subscription?.plan ?? 'ESSENTIEL',
      status: subscription?.status ?? 'ACTIVE',
      createdAt: creator.createdAt,
      productsCount: productCountMap.get(creator.id) ?? 0,
      ordersCount: orderData?.count ?? 0,
      totalRevenue: orderData?.revenue ?? 0,
    };
  });
}

/**
 * Fetch orders data for export — batch queries (no N+1)
 */
async function fetchOrdersData(startDate: Date, endDate: Date): Promise<OrderRecord[]> {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    select: {
      orderNumber: true,
      creatorId: true,
      customerName: true,
      customerEmail: true,
      status: true,
      totalAmount: true,
      createdAt: true,
      shippedAt: true,
      deliveredAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (orders.length === 0) return [];

  // Batch load creator names in a single query
  const creatorIds = [...new Set(orders.map((o) => o.creatorId))];
  const creators = await prisma.user.findMany({
    where: { id: { in: creatorIds } },
    select: { id: true, name: true },
  });
  const creatorNameMap = new Map(creators.map((c) => [c.id, c.name ?? 'Inconnu']));

  return orders.map((order) => ({
    orderNumber: order.orderNumber,
    creatorName: creatorNameMap.get(order.creatorId) ?? 'Inconnu',
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    status: order.status,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
  }));
}

/**
 * Fetch revenue data for export — batch queries (no N+1)
 */
async function fetchRevenueData(startDate: Date, endDate: Date): Promise<RevenueRecord[]> {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: { notIn: ['PENDING', 'CANCELED', 'REFUNDED'] },
    },
    select: { creatorId: true, totalAmount: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  if (orders.length === 0) return [];

  // Batch load creator names in a single query
  const creatorIds = [...new Set(orders.map((o) => o.creatorId))];
  const creators = await prisma.user.findMany({
    where: { id: { in: creatorIds } },
    select: { id: true, name: true },
  });
  const creatorNameMap = new Map(creators.map((c) => [c.id, c.name ?? 'Inconnu']));

  // Group orders by creator and month in memory
  const groupedData = new Map<string, {
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
      groupedData.set(key, {
        creatorName: creatorNameMap.get(order.creatorId) ?? 'Inconnu',
        month,
        ordersCount: 0,
        totalRevenue: 0,
      });
    }

    const data = groupedData.get(key)!;
    data.ordersCount += 1;
    data.totalRevenue += order.totalAmount;
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
