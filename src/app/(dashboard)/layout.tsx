import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DashboardSidebar } from '@/components/dashboard/sidebar';

export default async function DashboardLayout({
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

  const badges: Record<string, number> = {};

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <DashboardSidebar badges={badges} />

      <div className="flex flex-1 flex-col">
        <main className="flex-1 px-6 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
