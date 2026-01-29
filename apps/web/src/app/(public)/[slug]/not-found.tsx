import Link from 'next/link';
import { prisma } from '@/lib/prisma/client';

export default async function NotFound() {
  // Get some published pages for suggestions
  const popularPages = await prisma.creatorPage.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      slug: true,
      title: true,
    },
    take: 4,
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Page non trouvee</h2>
        <p className="text-muted-foreground mb-8">
          Cette page de createur n&apos;existe pas ou n&apos;est pas encore publiee.
        </p>

        {popularPages.length > 0 && (
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-4">
              Decouvrez nos createurs :
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {popularPages.map((page: { slug: string; title: string }) => (
                <Link
                  key={page.slug}
                  href={`/${page.slug}`}
                  className="inline-block px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  {page.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        <Link
          href="/"
          className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Retour a l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
