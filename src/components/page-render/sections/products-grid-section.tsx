import Image from "next/image";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  slug?: string;
}

interface ProductsGridContent {
  columns?: 2 | 3 | 4;
  products?: Product[];
  showPrices?: boolean;
}

interface ProductsGridSectionProps {
  title: string;
  content: ProductsGridContent;
  creatorSlug: string;
}

export function ProductsGridSection({
  title,
  content,
  creatorSlug,
}: ProductsGridSectionProps) {
  const { columns = 4, products = [], showPrices = true } = content;

  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#D9D9D9] px-6 py-16 md:px-12 md:py-24 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-8 font-[family-name:var(--font-montserrat)] text-xl font-semibold uppercase md:text-2xl lg:text-[40px] lg:leading-[1.22]">
          {title}
        </h2>
        <div className={`grid grid-cols-2 ${gridCols[columns]} gap-6`}>
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/${creatorSlug}/products/${product.slug || product.id}`}
              className="group block overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-square overflow-hidden">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <span className="text-muted-foreground">No image</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="truncate font-[family-name:var(--font-montserrat)] font-medium">
                  {product.name}
                </h3>
                {showPrices && (
                  <p className="mt-1 font-[family-name:var(--font-montserrat)] font-bold text-foreground">
                    {(product.price / 100).toFixed(2)} &euro;
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
