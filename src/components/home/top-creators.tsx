import Link from "next/link";
import Image from "next/image";

const creators = [
  {
    name: "Createur N°One",
    slug: "createur-one",
    image: "/images/creator-hero.png",
  },
  {
    name: "Atelier Normand",
    slug: "atelier-normand",
    image: "/images/product-4.png",
  },
  {
    name: "Les Fils d'Or",
    slug: "les-fils-dor",
    image: "/images/product-1.png",
  },
  {
    name: "Studio Caen",
    slug: "studio-caen",
    image: "/images/product-2.png",
  },
];

export function TopCreators() {
  return (
    <section className="bg-[#D9D9D9] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="font-[family-name:var(--font-montserrat)] text-lg font-semibold md:text-xl lg:text-2xl">
          Top createurs
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">depuis : 1 jour</p>

        <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
          {creators.map((creator) => (
            <Link
              key={creator.slug}
              href={`/${creator.slug}`}
              className="group block overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={creator.image}
                  alt={creator.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="font-[family-name:var(--font-montserrat)] text-sm font-semibold uppercase md:text-base">
                  {creator.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
