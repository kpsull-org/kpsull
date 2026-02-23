import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma/client';

// Déduplique la query entre generateMetadata et la page dans le même rendu (Vercel best practice 3.6)
const getCreatorPage = cache(async (slug: string) => {
  return prisma.creatorPage.findFirst({
    where: { slug, status: 'PUBLISHED' },
  });
});

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

type VariantWithProduct = {
  id: string;
  images: unknown;
  priceOverride: number | null;
  product: {
    id: string;
    name: string;
    price: number;
    projectId: string | null;
  };
};

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  pinterest: 'Pinterest',
  youtube: 'YouTube',
  depop: 'Depop',
  behance: 'Behance',
  vsco: 'VSCO',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  twitter: 'Twitter / X',
  substack: 'Substack',
};

const BANNER_POSITION_CLASSES: Record<string, string> = {
  top: 'object-top',
  center: 'object-center',
  bottom: 'object-bottom',
};

function getBannerPositionClass(pos?: string | null): string {
  return BANNER_POSITION_CLASSES[pos ?? ''] ?? 'object-center';
}

const TITLE_FONT_CLASSES: Record<string, string> = {
  'jacquard-12': 'font-[family-name:var(--font-jacquard-12)]',
  'montserrat': 'font-[family-name:var(--font-montserrat)] font-bold',
  'archivo': 'font-[family-name:var(--font-archivo)] font-bold',
};

function getTitleFontClass(titleFont?: string | null): string {
  return TITLE_FONT_CLASSES[titleFont ?? ''] ?? 'font-[family-name:var(--font-jacquard-12)]';
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function ProductGrid({ variants }: { readonly variants: VariantWithProduct[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      {variants.map((variant) => {
        const images = Array.isArray(variant.images) ? (variant.images as string[]) : [];
        const img1 = images[0] ?? null;
        const img2 = images[1] ?? null;
        const price = variant.priceOverride ?? variant.product.price;

        return (
          <Link
            key={variant.id}
            href={`/catalogue/${variant.product.id}?variant=${variant.id}`}
            className="group block border-t border-black bg-white [&:nth-child(-n+2)]:border-t-0 sm:[&:nth-child(-n+3)]:border-t-0 lg:[&:nth-child(-n+4)]:border-t-0"
          >
            <div className="relative aspect-square overflow-hidden bg-[#F5F5F3]">
              {img1 ? (
                <>
                  <Image
                    src={img1}
                    alt={variant.product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className={`object-cover transition-all duration-500 ${
                      img2 ? 'group-hover:opacity-0' : 'group-hover:scale-105'
                    }`}
                  />
                  {img2 && (
                    <Image
                      src={img2}
                      alt={`${variant.product.name} — vue 2`}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="absolute inset-0 object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    />
                  )}
                </>
              ) : (
                <div className="h-full w-full bg-[#EBEBEB]" />
              )}
            </div>
            <div className="border-t border-black px-3 py-2.5">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-black">
                {variant.product.name}
              </p>
              <p className="mt-0.5 text-[12px] font-bold text-black">
                {formatPrice(price)}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export async function generateStaticParams() {
  try {
    const pages = await prisma.creatorPage.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true },
      take: 100,
    });
    return pages.map((page) => ({ slug: page.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const page = await getCreatorPage(slug);

  if (!page) {
    return {
      title: 'Page non trouvée | Kpsull',
      description: "Cette page de créateur n'existe pas ou n'est pas encore publiée.",
    };
  }

  const description = page.description ?? `Découvrez les créations uniques de ${page.title} sur Kpsull`;
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
      ...(page.bannerImage && { images: [{ url: page.bannerImage }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description,
      ...(page.bannerImage && { images: [page.bannerImage] }),
    },
    alternates: { canonical: url },
  };
}

export default async function PublicCreatorPage({ params }: PageProps) {
  const { slug } = await params;

  const page = await getCreatorPage(slug);

  if (!page) notFound();

  const [projects, variants] = await Promise.all([
    prisma.project.findMany({
      where: { creatorId: page.creatorId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.productVariant.findMany({
      where: {
        product: {
          creatorId: page.creatorId,
          status: 'PUBLISHED',
        },
      },
      select: {
        id: true,
        images: true,
        priceOverride: true,
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            projectId: true,
          },
        },
      },
      orderBy: { product: { publishedAt: 'desc' } },
    }),
  ]);

  // Group variants by projectId
  const variantsByProject = new Map<string | null, VariantWithProduct[]>();
  for (const v of variants) {
    const key = v.product.projectId ?? null;
    const list = variantsByProject.get(key) ?? [];
    list.push(v);
    variantsByProject.set(key, list);
  }

  const socialLinks = page.socialLinks as Record<string, string> | null;
  const hasSocialLinks = socialLinks && Object.keys(socialLinks).length > 0;
  const namedCollections = projects.filter((p) => (variantsByProject.get(p.id)?.length ?? 0) > 0);
  const unattachedVariants = variantsByProject.get(null) ?? [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: page.title,
    description: page.description ?? 'Boutique sur Kpsull',
    url: `https://kpsull.com/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-white font-[family-name:var(--font-montserrat)]">
        {/* ─── HERO avec bannière ─── */}
        {page.bannerImage && (
          <section className="relative -mt-[98px] h-screen w-full overflow-hidden">
            <Image
              src={page.bannerImage}
              alt={page.title}
              fill
              className={`object-cover ${getBannerPositionClass(page.bannerPosition)}`}
              priority
            />
            <div className="absolute inset-0 bg-[rgba(2,20,8,0.45)]" />
            <div className="relative flex h-full flex-col items-start justify-end pb-16 pl-6 md:pb-24 md:pl-12 lg:pb-32 lg:pl-[82px]">
              <h1 className={`${getTitleFontClass(page.titleFont)} text-4xl leading-none md:text-6xl lg:text-7xl ${page.titleColor === 'black' ? 'text-black' : 'text-white'}`}>
                {page.title}
              </h1>
            </div>
          </section>
        )}

        {/* Accroche sous la bannière (ou sous le header sans bannière) */}
        {page.tagline && page.bannerImage && (
          <div className="border-b border-black px-6 py-4 md:px-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-black/50">
              {page.tagline}
            </p>
          </div>
        )}

        {/* ─── HEADER sans bannière ─── */}
        {!page.bannerImage && (
          <section className="border-b border-black px-6 pt-12 pb-8 md:px-12">
            <h1 className={`${getTitleFontClass(page.titleFont)} text-3xl leading-tight text-black md:text-5xl`}>
              {page.title}
            </h1>
            {page.tagline && (
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-black/40">
                {page.tagline}
              </p>
            )}
          </section>
        )}

        {/* ─── BIO + RÉSEAUX SOCIAUX ─── */}
        {(page.description || hasSocialLinks) && (
          <section className="border-b border-black px-6 py-10 md:px-12">
            <div className="max-w-2xl">
              {page.description && (
                <p className="mb-6 text-base leading-[1.8] text-black/70">
                  {page.description}
                </p>
              )}
              {hasSocialLinks && socialLinks && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(socialLinks).map(([key, url]) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-black px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-black transition-colors hover:bg-black hover:text-white"
                    >
                      {SOCIAL_LABELS[key] ?? key}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── COLLECTIONS ─── */}
        {namedCollections.map((project) => {
          const collectionVariants = variantsByProject.get(project.id) ?? [];
          return (
            <section key={project.id} className="border-b border-black">
              <div className="flex items-baseline gap-3 border-b border-black px-6 py-5 md:px-12">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
                  Collection
                </p>
                <h2 className="text-xl font-bold uppercase tracking-tight text-black">
                  {project.name}
                </h2>
              </div>
              <ProductGrid variants={collectionVariants} />
            </section>
          );
        })}

        {/* ─── PIÈCES SANS COLLECTION ─── */}
        {unattachedVariants.length > 0 && (
          <section className="border-b border-black">
            {namedCollections.length > 0 && (
              <div className="border-b border-black px-6 py-5 md:px-12">
                <h2 className="text-xl font-bold uppercase tracking-tight text-black">
                  Autres pièces
                </h2>
              </div>
            )}
            <ProductGrid variants={unattachedVariants} />
          </section>
        )}

        {/* ─── AUCUN PRODUIT ─── */}
        {variants.length === 0 && (
          <section className="px-6 py-24 text-center md:px-12">
            <p className="text-[10px] uppercase tracking-[0.2em] text-black/30">
              Aucun produit disponible pour le moment
            </p>
          </section>
        )}
      </div>
    </>
  );
}
