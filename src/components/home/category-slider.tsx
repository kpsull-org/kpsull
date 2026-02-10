import Link from "next/link";
import Image from "next/image";

const STYLES = [
  { name: "STREETSTYLE", slug: "streetstyle", image: "/images/creator-hero.png" },
  { name: "CLASSIC", slug: "classic", image: "/images/hero-about.png" },
  { name: "SPORTIF", slug: "sportif", image: "/images/hero-skater.png" },
  { name: "SCANDI", slug: "scandi", image: "/images/hero-creator.png" },
  { name: "AVANT-GARDE", slug: "avant-garde", image: "/images/hero-project.png" },
  { name: "Y2K", slug: "y2k", image: "/images/category-slider-bg.png" },
] as const;

export function CategorySlider() {
  return (
    <section className="bg-[#D9D9D9] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-20">
      <div className="mx-auto max-w-7xl">
        {/* Title with underline decoration */}
        <h2 className="mb-8 text-center font-[family-name:var(--font-montserrat)] text-lg font-semibold uppercase tracking-wide md:mb-10 md:text-xl lg:text-2xl">
          <span className="border-b-2 border-black pb-2">
            DECOUVRIR LES STYLES
          </span>
        </h2>

        {/* 3x2 Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6">
          {STYLES.map((style) => (
            <Link
              key={style.slug}
              href={`/catalogue?style=${style.slug}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl"
            >
              <Image
                src={style.image}
                alt={style.name}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 transition-colors group-hover:bg-black/50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-[family-name:var(--font-montserrat)] text-sm font-semibold uppercase tracking-wider text-white md:text-base lg:text-lg">
                  {style.name}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Link below */}
        <div className="mt-8 text-center md:mt-10">
          <Link
            href="/catalogue"
            className="font-[family-name:var(--font-archivo)] text-sm font-medium underline underline-offset-4 hover:no-underline md:text-base"
          >
            Voir toutes les categories
          </Link>
        </div>
      </div>
    </section>
  );
}
