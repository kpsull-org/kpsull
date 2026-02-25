import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { requireCreatorAuth } from '@/lib/api/require-auth';
import { PrismaReturnRepository } from '@/modules/returns/infrastructure/repositories';
import type { ReturnStatusValue } from '@/modules/returns/domain/value-objects/return-status.vo';

const returnRepository = new PrismaReturnRepository(prisma);

/**
 * GET /api/creator/returns
 *
 * Get return requests for the authenticated creator.
 * Used in the creator's backoffice to manage returns.
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 10)
 * - status: ReturnStatusValue (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireCreatorAuth();
    if (!authResult.success) {
      return authResult.response;
    }

    const { id: creatorId } = authResult.user;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const status = searchParams.get('status') as ReturnStatusValue | null;

    const skip = (page - 1) * limit;

    const filters = status ? { status } : undefined;

    const { returns, total } = await returnRepository.findByCreatorId(
      creatorId,
      filters,
      { skip, take: limit }
    );

    // Batch load order details for all returns in a single query
    const orderIds = returns.map((ret) => ret.orderId);
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: {
        id: true,
        totalAmount: true,
        items: { select: { productName: true, variantInfo: true, quantity: true, price: true, image: true } },
      },
    });
    const orderMap = new Map(orders.map((o) => [o.id, o]));

    const enrichedReturns = returns.map((ret) => {
      const order = orderMap.get(ret.orderId);
      return {
        ...ret,
        order: order
          ? {
              totalAmount: order.totalAmount,
              items: order.items.map((item) => ({
                productName: item.productName,
                variantInfo: item.variantInfo,
                quantity: item.quantity,
                price: item.price,
                image: item.image,
              })),
            }
          : null,
      };
    });

    return NextResponse.json({
      returns: enrichedReturns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List creator returns error:', error);
    return NextResponse.json({ error: 'Erreur lors de la recuperation des retours' }, { status: 500 });
  }
}
