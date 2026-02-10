import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Styles | Kpsull",
  description: "Découvrez les différents styles vestimentaires proposés par nos créateurs.",
};

const STYLES = [
  {
    name: "STREETSTYLE",
    slug: "streetstyle",
    image: "/images/styles/streetstyle.jpg",
    description:
      "Un style urbain et décontracté, inspiré de la culture des rues. Sneakers, hoodies oversized, et accessoires audacieux pour un look authentique et moderne.",
  },
  {
    name: "CLASSIC",
    slug: "classic",
    image: "/images/styles/classic.jpg",
    description:
      "L'élégance intemporelle. Des coupes structurées, des matières nobles et des couleurs sobres pour un style raffiné qui traverse les époques.",
  },
  {
    name: "SPORTIF",
    slug: "sportif",
    image: "/images/styles/sportif.jpg",
    description:
      "Performance et confort au quotidien. Des pièces techniques et fonctionnelles qui allient style et praticité pour un mode de vie actif.",
  },
  {
    name: "SCANDI",
    slug: "scandi",
    image: "/images/styles/scandi.jpg",
    description:
      "La simplicité scandinave. Des lignes épurées, des tons neutres et des matières naturelles pour un minimalisme chic et fonctionnel.",
  },
  {
    name: "AVANT-GARDE",
    slug: "avant-garde",
    image: "/images/styles/avant-garde.jpg",
    description:
      "Repousser les limites de la mode. Des silhouettes expérimentales, des textures inattendues et des designs conceptuels pour les esprits créatifs.",
  },
  {
    name: "Y2K",
    slug: "y2k",
    image: "/images/styles/y2k.jpg",
    description:
      "Le retour des années 2000. Couleurs vibrantes, imprimés graphiques et accessoires flashy pour un style nostalgique et décomplexé.",
  },
] as const;

export default function StylesPage() {
  return (
    <div className="bg-[#D9D9D9]">
      {/* Hero header */}
      <section className="bg-black px-6 py-16 text-center md:px-12 md:py-20 lg:py-24">
        <h1 className="font-[family-name:var(--font-montserrat)] text-3xl font-bold uppercase tracking-widest text-white md:text-4xl lg:text-5xl">
          Nos Styles
        </h1>
        <p className="mx-auto mt-4 max-w-2xl font-[family-name:var(--font-archivo)] text-sm text-gray-300 md:text-base">
          Explorez les univers vestimentaires de nos créateurs et trouvez le style qui vous correspond.
        </p>
      </section>

      {/* Style sections */}
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-20">
        <div className="space-y-16 md:space-y-20">
          {STYLES.map((style, index) => (
            <section
              key={style.slug}
              id={style.slug}
              className="scroll-mt-24"
            >
              <div
                className={`flex flex-col gap-6 md:gap-8 lg:gap-12 ${
                  index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                }`}
              >
                {/* Style image */}
                <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl lg:w-1/2">
                  <Image
                    src={style.image}
                    alt={style.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h2 className="font-[family-name:var(--font-montserrat)] text-2xl font-bold uppercase tracking-widest text-white md:text-3xl lg:text-4xl">
                      {style.name}
                    </h2>
                  </div>
                </div>

                {/* Style info */}
                <div className="flex flex-col justify-center lg:w-1/2">
                  <p className="font-[family-name:var(--font-archivo)] text-sm leading-relaxed text-gray-700 md:text-base lg:text-lg">
                    {style.description}
                  </p>
                  <div className="mt-6">
                    <Link
                      href={`/catalogue?style=${style.slug}`}
                      className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 font-[family-name:var(--font-montserrat)] text-sm font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-80"
                    >
                      Découvrir les pièces
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
