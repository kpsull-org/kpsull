import Link from "next/link";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma/client";

const getTopCreatorsData = unstable_cache(
  async () => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const topByRevenue = await prisma.order.groupBy({
      by: ['creatorId'],
      where: {
        status: { notIn: ['CANCELED', 'REFUNDED'] },
        createdAt: { gte: startOfMonth },
      },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 4,
    });

    const rankedCreatorIds = topByRevenue.map((r) => r.creatorId);

    const rankedPages = rankedCreatorIds.length > 0
      ? await prisma.creatorPage.findMany({
          where: { creatorId: { in: rankedCreatorIds }, status: 'PUBLISHED' },
          select: { slug: true, title: true, creatorId: true },
        })
      : [];

    const rankedPagesOrdered = rankedCreatorIds
      .map((id) => rankedPages.find((p) => p.creatorId === id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);

    const needed = 4 - rankedPagesOrdered.length;
    const fallbackPages = needed > 0
      ? await prisma.creatorPage.findMany({
          where: {
            status: 'PUBLISHED',
            creatorId: { notIn: rankedCreatorIds },
          },
          orderBy: { publishedAt: 'desc' },
          take: needed,
          select: { slug: true, title: true, creatorId: true },
        })
      : [];

    const creatorPages = [...rankedPagesOrdered, ...fallbackPages];

    if (creatorPages.length === 0) return null;

    const creatorIds = creatorPages.map((p) => p.creatorId);

    // Paralléliser les 3 requêtes indépendantes (async-parallel — Vercel best practice 1.4)
    const [onboardings, users, firstProducts] = await Promise.all([
      prisma.creatorOnboarding.findMany({
        where: { userId: { in: creatorIds } },
        select: { userId: true, brandName: true },
      }),
      prisma.user.findMany({
        where: { id: { in: creatorIds } },
        select: { id: true, image: true, name: true },
      }),
      prisma.product.findMany({
        where: {
          creatorId: { in: creatorIds },
          status: 'PUBLISHED',
        },
        orderBy: { publishedAt: 'desc' },
        distinct: ['creatorId'],
        include: {
          variants: {
            take: 1,
            select: { images: true },
          },
        },
      }),
    ]);

    return { creatorPages, onboardings, users, firstProducts };
  },
  ['top-creators'],
  { revalidate: 300, tags: ['creators'] },
);

export async function TopCreators() {
  const data = await getTopCreatorsData();

  if (!data) return null;

  const { creatorPages, onboardings, users, firstProducts } = data;

  const brandByCreator = Object.fromEntries(onboardings.map((o) => [o.userId, o.brandName]));
  const userById = Object.fromEntries(users.map((u) => [u.id, u]));
  const productByCreator = Object.fromEntries(firstProducts.map((p) => [p.creatorId, p]));

  return (
    <section className="bg-[#F2F2F2] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="font-[family-name:var(--font-montserrat)] text-lg font-semibold md:text-xl lg:text-2xl">
          Top créateurs du mois
        </h2>

        <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
          {creatorPages.map((page) => {
            const brandName = brandByCreator[page.creatorId] ?? page.title;
            const user = userById[page.creatorId];
            const product = productByCreator[page.creatorId];
            const productImages = Array.isArray(product?.variants[0]?.images)
              ? (product.variants[0].images as string[])
              : [];
            const coverImage = user?.image ?? productImages[0] ?? null;

            return (
              <Link
                key={page.slug}
                href={`/${page.slug}`}
                className="group block overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {coverImage ? (
                    <Image
                      src={coverImage}
                      alt={brandName ?? page.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gray-200" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-[family-name:var(--font-montserrat)] text-sm font-semibold uppercase md:text-base">
                    {brandName ?? page.title}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
