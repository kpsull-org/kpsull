import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import {
  generateCsvContent,
  generateExportFilename,
  type SaleRecord,
} from '@/lib/utils/csv-export';

/**
 * GET /api/dashboard/export
 *
 * Export sales data as CSV for PRO creators.
 *
 * Query Parameters:
 * - creatorId: string (required) - The creator's ID
 * - startDate: string (required) - ISO date string for period start
 * - endDate: string (required) - ISO date string for period end
 *
 * Returns:
 * - 200: CSV file download
 * - 400: Missing required parameters
 * - 401: Not authenticated
 * - 403: Not authorized (not PRO or not the creator)
 * - 500: Server error
 */

interface ParsedParams {
  creatorId: string;
  startDate: Date;
  endDate: Date;
}

function parseExportParams(
  searchParams: URLSearchParams
): { error: string; status: number } | ParsedParams {
  const creatorId = searchParams.get('creatorId');
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');

  if (!creatorId || !startDateStr || !endDateStr) {
    return {
      error: 'Parametres manquants: creatorId, startDate, endDate requis',
      status: 400,
    };
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { error: 'Dates invalides', status: 400 };
  }

  const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 366) {
    return { error: 'La periode ne peut pas depasser 12 mois', status: 400 };
  }

  return { creatorId, startDate, endDate };
}

function isParseError(
  result: { error: string; status: number } | ParsedParams
): result is { error: string; status: number } {
  return 'error' in result;
}

async function isAuthorized(userId: string, creatorId: string): Promise<boolean> {
  const onboarding = await prisma.creatorOnboarding.findUnique({
    where: { userId },
  });

  if (onboarding?.userId === userId) return true;
  return userId === creatorId;
}

async function hasExportSubscription(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      OR: [{ userId }, { creatorId: userId }],
    },
  });

  return Boolean(
    subscription &&
      (subscription.plan === 'STUDIO' || subscription.plan === 'ATELIER')
  );
}

function ordersToSaleRecords(
  orders: Array<{
    createdAt: Date;
    customerName: string;
    items: Array<{
      productName: string;
      variantInfo: string | null;
      quantity: number;
      price: number;
    }>;
  }>
): SaleRecord[] {
  return orders.flatMap((order) =>
    order.items.map((item) => ({
      date: order.createdAt,
      productName: item.productName + (item.variantInfo ? ` - ${item.variantInfo}` : ''),
      quantity: item.quantity,
      amount: item.price * item.quantity,
      customerName: order.customerName,
    }))
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = parseExportParams(searchParams);

    if (isParseError(params)) {
      return NextResponse.json({ error: params.error }, { status: params.status });
    }

    const { creatorId, startDate, endDate } = params;

    const authorized = await isAuthorized(session.user.id, creatorId);
    if (!authorized) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    const hasAccess = await hasExportSubscription(session.user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Cette fonctionnalite est reservee aux abonnes Studio et Atelier' },
        { status: 403 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        creatorId: session.user.id,
        createdAt: { gte: startDate, lte: endDate },
        status: { notIn: ['PENDING', 'CANCELED', 'REFUNDED'] },
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    const saleRecords = ordersToSaleRecords(orders);
    const csvContent = generateCsvContent(saleRecords);
    const filename = generateExportFilename(startDate, endDate);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Erreur lors de lexport' }, { status: 500 });
  }
}
