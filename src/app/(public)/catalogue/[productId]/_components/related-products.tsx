import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma/client";

interface RelatedProductsProps {
  productId: string;
  creatorId: string;
  category?: string | null;
}

type RelatedProduct = {
  id: string;
  name: string;
  price: number;
  variants: {
    images: string[];
    priceOverride: number | null;
  }[];
};

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

async function fetchRelatedProducts(
  productId: string,
  creatorId: string,
  category?: string | null
): Promise<RelatedProduct[]> {
  const collected: RelatedProduct[] = [];
  const excludedIds = [productId];
  const target = 4;

  const toRelatedProduct = (p: {
    id: string;
    name: string;
    price: number;
    variants: { images: unknown; priceOverride: number | null }[];
  }): RelatedProduct => ({
    id: p.id,
    name: p.name,
    price: p.price,
    variants: p.variants.map((v) => ({
      images: Array.isArray(v.images) ? (v.images as string[]) : [],
      priceOverride: v.priceOverride,
    })),
  });

  // Batch 1: same creator + same category
  if (category && collected.length < target) {
    const batch = await prisma.product.findMany({
      where: {
        id: { notIn: excludedIds },
        status: "PUBLISHED",
        creatorId,
        category,
      },
      orderBy: { publishedAt: "desc" },
      take: target - collected.length,
      select: {
        id: true,
        name: true,
        price: true,
        variants: {
          take: 1,
          select: { images: true, priceOverride: true },
        },
      },
    });

    const mapped = batch.map(toRelatedProduct);
    collected.push(...mapped);
    excludedIds.push(...mapped.map((p) => p.id));
  }

  // Batch 2: same category (all creators)
  if (category && collected.length < target) {
    const batch = await prisma.product.findMany({
      where: {
        id: { notIn: excludedIds },
        status: "PUBLISHED",
        category,
      },
      orderBy: { publishedAt: "desc" },
      take: target - collected.length,
      select: {
        id: true,
        name: true,
        price: true,
        variants: {
          take: 1,
          select: { images: true, priceOverride: true },
        },
      },
    });

    const mapped = batch.map(toRelatedProduct);
    collected.push(...mapped);
    excludedIds.push(...mapped.map((p) => p.id));
  }

  // Batch 3: same creator (all categories)
  if (collected.length < target) {
    const batch = await prisma.product.findMany({
      where: {
        id: { notIn: excludedIds },
        status: "PUBLISHED",
        creatorId,
      },
      orderBy: { publishedAt: "desc" },
      take: target - collected.length,
      select: {
        id: true,
        name: true,
        price: true,
        variants: {
          take: 1,
          select: { images: true, priceOverride: true },
        },
      },
    });

    const mapped = batch.map(toRelatedProduct);
    collected.push(...mapped);
  }

  return collected;
}

export async function RelatedProducts({
  productId,
  creatorId,
  category,
}: RelatedProductsProps) {
  const products = await fetchRelatedProducts(productId, creatorId, category);

  if (products.length === 0) return null;

  return (
    <section className="border-t border-black font-[family-name:var(--font-montserrat)]">
      <div className="px-6 lg:px-8 pt-8 pb-5">
        <h2 className="text-[10px] uppercase tracking-[0.2em] text-black/55 font-semibold">
          Vous aimerez aussi
        </h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {products.map((product) => {
          const firstVariant = product.variants[0];
          const firstImage = firstVariant?.images[0] ?? null;
          const displayPrice =
            firstVariant?.priceOverride ?? product.price;

          return (
            <Link
              key={product.id}
              href={`/catalogue/${product.id}`}
              className="group block bg-white"
            >
              <div className="aspect-square relative overflow-hidden bg-[#F5F5F3]">
                {firstImage ? (
                  <Image
                    src={firstImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-[#EBEBEB]" />
                )}
              </div>
              <div className="border-t border-black border-r border-black group-last:border-r-0 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-black truncate">
                  {product.name}
                </p>
                <p className="text-sm font-bold text-black mt-1">
                  {formatPrice(displayPrice)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
