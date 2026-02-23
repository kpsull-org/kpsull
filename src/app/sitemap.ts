import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma/client';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kpsull.com';

export const revalidate = 3600; // Revalide le sitemap toutes les heures

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pages statiques
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/createurs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // Pages créateurs dynamiques
  let creatorPages: MetadataRoute.Sitemap = [];
  try {
    const pages = await prisma.creatorPage.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    });

    creatorPages = pages.map((page) => ({
      url: `${BASE_URL}/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {
    // Si la DB est indisponible au build, on renvoie les pages statiques uniquement
  }

  return [...staticPages, ...creatorPages];
}
