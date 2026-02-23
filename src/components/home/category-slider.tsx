import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma/client";

export async function CategorySlider() {
  const styles = await prisma.style.findMany({
    where: { status: 'APPROVED', isCustom: false },
    select: { name: true, imageUrl: true },
    orderBy: { name: 'asc' },
  });

  if (styles.length === 0) return null;

  return (
    <section className="bg-[#F2F2F2] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex justify-center md:mb-10">
          <h2 className="rounded-full bg-black px-8 py-2 font-[family-name:var(--font-montserrat)] text-sm font-semibold uppercase tracking-widest text-white md:px-10 md:py-2.5 md:text-base lg:text-lg">
            DECOUVRIR LES STYLES
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
          {styles.map((style) => {
            const slug = style.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            return (
              <Link
                key={style.name}
                href={`/catalogue?style=${slug}`}
                className="group relative aspect-[2/1] overflow-hidden rounded-2xl"
              >
                {style.imageUrl ? (
                  <Image
                    src={style.imageUrl}
                    alt={style.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-300" />
                )}
                <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-[family-name:var(--font-montserrat)] text-sm font-semibold uppercase tracking-wider text-white md:text-base lg:text-lg">
                    {style.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
