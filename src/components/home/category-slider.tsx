import Link from "next/link";
import Image from "next/image";

const STYLES = [
  { name: "STREETSTYLE", slug: "streetstyle", image: "/images/styles/streetstyle.jpg" },
  { name: "CLASSIC", slug: "classic", image: "/images/styles/classic.jpg" },
  { name: "SPORTIF", slug: "sportif", image: "/images/styles/sportif.jpg" },
  { name: "SCANDI", slug: "scandi", image: "/images/styles/scandi.jpg" },
  { name: "AVANT-GARDE", slug: "avant-garde", image: "/images/styles/avant-garde.jpg" },
  { name: "Y2K", slug: "y2k", image: "/images/styles/y2k.jpg" },
] as const;

export function CategorySlider() {
  return (
    <section className="bg-[#D9D9D9] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-20">
      <div className="mx-auto max-w-7xl">
        {/* Title badge: white text on black background */}
        <div className="mb-8 flex justify-center md:mb-10">
          <h2 className="rounded-full bg-black px-8 py-2 font-[family-name:var(--font-montserrat)] text-sm font-semibold uppercase tracking-widest text-white md:px-10 md:py-2.5 md:text-base lg:text-lg">
            DECOUVRIR LES STYLES
          </h2>
        </div>

        {/* 3x2 uniform grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
          {STYLES.map((style) => (
            <Link
              key={style.slug}
              href={`/catalogue?style=${style.slug}`}
              className="group relative aspect-[2/1] overflow-hidden rounded-2xl"
            >
              <Image
                src={style.image}
                alt={style.name}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-[family-name:var(--font-montserrat)] text-sm font-semibold uppercase tracking-wider text-white md:text-base lg:text-lg">
                  {style.name}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA link */}
        <div className="mt-8 flex justify-center md:mt-10">
          <Link
            href="/styles"
            className="font-[family-name:var(--font-montserrat)] text-sm font-medium text-black underline hover:opacity-70 md:text-base"
          >
            Voir tous les styles
          </Link>
        </div>
      </div>
    </section>
  );
}
