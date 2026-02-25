import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/client";

export const revalidate = 3600;
import { ProductClient } from "./_components/product-client";
import { RelatedProducts } from "./_components/related-products";

interface ProductPageProps {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ variant?: string }>;
}

const getProduct = cache(async (productId: string) =>
  prisma.product.findUnique({
    where: { id: productId, status: "PUBLISHED" },
    include: {
      variants: {
        include: {
          skus: { select: { size: true, stock: true } },
        },
      },
    },
  })
);

export async function generateMetadata({
  params,
}: Readonly<ProductPageProps>): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProduct(productId);
  if (!product) return { title: "Produit introuvable — KPSULL" };

  return {
    title: `${product.name} — KPSULL`,
    description: product.description ?? undefined,
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: Readonly<ProductPageProps>) {
  const { productId } = await params;
  const { variant: variantParam } = await searchParams;

  const product = await getProduct(productId);

  if (!product) notFound();

  // Fetch brand name and creator slug in parallel
  const [creatorOnboarding, creatorPage] = await Promise.all([
    prisma.creatorOnboarding.findUnique({
      where: { userId: product.creatorId },
      select: { brandName: true },
    }),
    prisma.creatorPage.findFirst({
      where: { creatorId: product.creatorId },
      select: { slug: true },
    }),
  ]);

  const brandName = creatorOnboarding?.brandName ?? null;
  const creatorSlug = creatorPage?.slug ?? '';

  // Determine selected variant
  const validVariant =
    variantParam &&
    product.variants.find((v) => v.id === variantParam);
  const selectedVariant = validVariant || product.variants[0];
  const selectedVariantId = selectedVariant?.id ?? "";

  // Map variants for client component
  const variantsForClient = product.variants.map((v) => ({
    id: v.id,
    name: v.name,
    color: v.color,
    colorCode: v.colorCode,
    images: Array.isArray(v.images) ? (v.images as string[]) : [],
    skus: v.skus.map((sku) => ({ size: sku.size, stock: sku.stock })),
    priceOverride: v.priceOverride,
  }));

  // Build additional info rows
  const infoRows: { key: string; value: string }[] = [];
  if (product.materials) infoRows.push({ key: "Matière", value: product.materials });
  if (product.fit) infoRows.push({ key: "Coupe", value: product.fit });
  if (product.gender) infoRows.push({ key: "Genre", value: product.gender });
  if (product.category) infoRows.push({ key: "Catégorie", value: product.category });
  if (product.season) infoRows.push({ key: "Saison", value: product.season });
  if (product.madeIn) infoRows.push({ key: "Pays de fabrication", value: product.madeIn });

  return (
    <div className="bg-white font-[family-name:var(--font-montserrat)]">
      {/* Breadcrumb header */}
      <div className="px-6 py-3 border-b border-black flex items-center gap-2 text-[10px] uppercase tracking-[0.15em]">
        <Link
          href="/catalogue"
          className="text-black/55 hover:text-black transition-colors"
        >
          Catalogue
        </Link>
        <span className="text-black/30">/</span>
        <span className="text-black/70">{product.name}</span>
      </div>

      {/* Main layout */}
      <ProductClient
        productId={productId}
        variants={variantsForClient}
        selectedVariantId={selectedVariantId}
        productPrice={product.price}
        productName={product.name}
        brandName={brandName}
        description={product.description ?? null}
        infoRows={infoRows}
        creatorSlug={creatorSlug}
      />
      <RelatedProducts
        productId={productId}
        creatorId={product.creatorId}
        category={product.category ?? null}
      />
    </div>
  );
}
