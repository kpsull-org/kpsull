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
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    // Validate required parameters
    if (!creatorId || !startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'Parametres manquants: creatorId, startDate, endDate requis' },
        { status: 400 }
      );
    }

    // Parse dates
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Dates invalides' }, { status: 400 });
    }

    // Check if user is the creator
    const onboarding = await prisma.creatorOnboarding.findUnique({
      where: { userId: session.user.id },
    });

    if (!onboarding || onboarding.userId !== session.user.id) {
      // Also check if the user ID matches the creatorId directly
      if (session.user.id !== creatorId) {
        return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
      }
    }

    // Check subscription status (must be STUDIO or ATELIER for export)
    const subscription = await prisma.subscription.findFirst({
      where: {
        OR: [{ userId: session.user.id }, { creatorId: session.user.id }],
      },
    });

    // Export is available for STUDIO and ATELIER plans
    const hasExportAccess = subscription &&
      (subscription.plan === 'STUDIO' || subscription.plan === 'ATELIER');

    if (!hasExportAccess) {
      return NextResponse.json(
        { error: 'Cette fonctionnalite est reservee aux abonnes Studio et Atelier' },
        { status: 403 }
      );
    }

    // Fetch orders with items for the period
    const orders = await prisma.order.findMany({
      where: {
        creatorId: session.user.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        // Only include completed sales (exclude canceled, refunded)
        status: {
          notIn: ['PENDING', 'CANCELED', 'REFUNDED'],
        },
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform orders into sale records
    const saleRecords: SaleRecord[] = [];

    for (const order of orders) {
      for (const item of order.items) {
        saleRecords.push({
          date: order.createdAt,
          productName: item.productName + (item.variantInfo ? ` - ${item.variantInfo}` : ''),
          quantity: item.quantity,
          amount: item.price * item.quantity,
          customerName: order.customerName,
        });
      }
    }

    // Generate CSV content
    const csvContent = generateCsvContent(saleRecords);

    // Generate filename
    const filename = generateExportFilename(startDate, endDate);

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
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Erreur lors de lexport' }, { status: 500 });
  }
}
