import Link from "next/link";
import Image from "next/image";

const offers = [
  {
    name: "Dress Jeany",
    price: 145,
    discountPrice: 58,
    discount: 60,
    image: "/images/product-1.png",
  },
  {
    name: "Jean Lean",
    price: 77,
    discountPrice: 54,
    discount: 30,
    image: "/images/product-2.png",
  },
  {
    name: "Hoodie H",
    price: 95,
    discountPrice: 86,
    discount: 10,
    image: "/images/product-3.png",
  },
];

export function FeaturedOffers() {
  return (
    <section className="bg-[#D9D9D9] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="font-[family-name:var(--font-montserrat)] text-lg font-semibold uppercase md:text-xl lg:text-2xl">
          OFFRES DU MOMENT
        </h2>
        <p className="mt-1 font-[family-name:var(--font-montserrat)] text-sm tracking-wider text-muted-foreground">
          OFFRES DE LA SAISON
        </p>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
          {offers.map((offer) => (
            <Link
              key={offer.name}
              href="/catalogue"
              className="group block overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative overflow-hidden">
                <div className="relative aspect-[3/4] bg-muted">
                  <Image
                    src={offer.image}
                    alt={offer.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="absolute right-4 top-4 rounded-full bg-[#E30613] px-3 py-1 text-sm font-bold text-white">
                  -{offer.discount}%
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-[family-name:var(--font-montserrat)] text-lg font-semibold">
                  {offer.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-sm text-muted-foreground line-through">
                    {offer.price}&euro;
                  </span>
                  <span className="font-[family-name:var(--font-montserrat)] text-xl font-bold text-foreground">
                    {offer.discountPrice}&euro;
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
