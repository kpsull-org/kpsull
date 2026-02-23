import Link from "next/link";

const styles = [
  { name: "Streetstyle", slug: "streetstyle" },
  { name: "Scandi", slug: "scandi" },
  { name: "Classic", slug: "classic" },
  { name: "Avant-garde", slug: "avant-garde" },
  { name: "Sportif", slug: "sportif" },
  { name: "Y2K", slug: "y2k" },
];

export function StylesGrid() {
  return (
    <section className="bg-[#F2F2F2] px-6 py-16 md:px-12 md:py-24 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-montserrat)] font-semibold text-xl md:text-2xl lg:text-[40px]">
            Decouvrir les styles
          </h2>
          <Link
            href="/catalogue"
            className="font-[family-name:var(--font-archivo)] font-medium text-sm md:text-base underline hover:no-underline"
          >
            Decouvrir toutes nos offres
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {styles.map((style) => (
            <Link
              key={style.slug}
              href={`/catalogue?style=${style.slug}`}
              className="group"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 transition-transform duration-300 group-hover:scale-105" />

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <span className="font-[family-name:var(--font-montserrat)] text-sm font-bold uppercase text-white md:text-base">
                    {style.name}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
