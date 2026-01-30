import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma/client';
import { PageRenderer } from '@/components/page-render/page-renderer';
import type { SectionTypeValue } from '@/modules/pages/domain/value-objects/section-type.vo';

// Revalidate every hour for ISR
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for popular creators
export async function generateStaticParams() {
  try {
    const pages = await prisma.creatorPage.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true },
      take: 100,
    });

    return pages.map((page) => ({ slug: page.slug }));
  } catch {
    // Return empty array during CI build when DB is not available
    // Pages will be generated on-demand with ISR
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const page = await prisma.creatorPage.findFirst({
    where: { slug, status: 'PUBLISHED' },
  });

  if (!page) {
    return {
      title: 'Page non trouvee | Kpsull',
      description: 'Cette page de createur n\'existe pas ou n\'est pas encore publiee.',
    };
  }

  const description = page.description || `Decouvrez les creations uniques sur Kpsull`;
  const url = `https://kpsull.com/${slug}`;

  return {
    title: `${page.title} | Kpsull`,
    description,
    openGraph: {
      title: page.title,
      description,
      type: 'website',
      url,
      siteName: 'Kpsull',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function PublicCreatorPage({ params }: PageProps) {
  const { slug } = await params;

  const page = await prisma.creatorPage.findFirst({
    where: {
      slug,
      status: 'PUBLISHED',
    },
    include: {
      sections: {
        where: { isVisible: true },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!page) {
    notFound();
  }

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: page.title,
    description: page.description || `Boutique sur Kpsull`,
    url: `https://kpsull.com/${slug}`,
  };

  // Transform Prisma data to PageRenderer format
  const pageData = {
    id: page.id,
    slug: page.slug,
    title: page.title,
    description: page.description ?? undefined,
    sections: page.sections.map((section: { id: string; type: string; title: string; content: unknown; position: number }) => ({
      id: section.id,
      type: section.type as SectionTypeValue,
      title: section.title,
      content: section.content as Record<string, unknown>,
      position: section.position,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageRenderer page={pageData} />
    </>
  );
}
