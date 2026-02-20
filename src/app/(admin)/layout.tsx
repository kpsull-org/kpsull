import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { StyleStatus } from '@prisma/client';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  try {
    session = await auth();
  } catch {
    // JWTSessionError: invalid/expired token
  }

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const pendingStylesCount = await prisma.style.count({
    where: { status: StyleStatus.PENDING_APPROVAL },
  });

  const badges: Record<string, number> = {
    '/admin/styles': pendingStylesCount,
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <AdminSidebar badges={badges} />

      <div className="flex flex-1 flex-col">
        <main className="flex-1 px-6 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
