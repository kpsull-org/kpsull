import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { GetOrderDetailUseCase } from '@/modules/orders/application/use-cases/get-order-detail.use-case';
import type { GetOrderDetailOutput } from '@/modules/orders/application/use-cases/get-order-detail.use-case';
import { PrismaOrderRepository } from '@/modules/orders/infrastructure/repositories/prisma-order.repository';
import type { Session } from 'next-auth';

interface CreatorOrderResult {
  order: GetOrderDetailOutput;
  session: Session;
}

/**
 * Shared helper for dashboard order detail pages.
 *
 * Performs auth check (creator or admin role required),
 * fetches the order, and returns the order and session.
 * Redirects to /login if unauthenticated, /profile if unauthorized,
 * and calls notFound() if the order does not exist or does not belong to the creator.
 */
export async function getCreatorOrderOrThrow(id: string): Promise<CreatorOrderResult> {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    redirect('/profile');
  }

  const orderRepository = new PrismaOrderRepository(prisma);
  const getOrderDetailUseCase = new GetOrderDetailUseCase(orderRepository);

  const result = await getOrderDetailUseCase.execute({
    orderId: id,
    creatorId: session.user.id,
  });

  if (result.isFailure) {
    notFound();
  }

  return { order: result.value, session };
}
