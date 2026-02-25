import Image from "next/image";
import Link from "next/link";

export function AboutTeaser() {
  return (
    <section className="kp-scroll-reveal border-t-2 border-black bg-white px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
          {/* Photo */}
          <div className="relative aspect-[4/5] overflow-hidden md:aspect-[4/3]">
            <Image
              src="https://res.cloudinary.com/damucxy2t/image/upload/v1771845067/kpsull/notre-histoire.jpg"
              alt="Notre histoire KPSULL"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Texte */}
          <div className="flex flex-col justify-center">
            <p className="font-[family-name:var(--font-montserrat)] text-[11px] font-semibold uppercase tracking-[0.25em] text-black/40">
              QUI SOMMES-NOUS ?
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-montserrat)] text-2xl font-bold uppercase leading-tight tracking-tight md:text-3xl">
              L&apos;ANTIDOTE
              <br />
              À L&apos;UNIFORME.
            </h2>
            <p className="mt-4 font-[family-name:var(--font-archivo)] text-sm leading-relaxed text-black/60">
              Kpsull est une plateforme qui connecte les créateurs de mode
              locaux aux passionnés de style unique. Nous croyons en une mode
              plus responsable, plus humaine — faite par et pour des individus.
            </p>
            <p className="mt-2 font-[family-name:var(--font-archivo)] text-sm leading-relaxed text-black/60">
              Chaque pièce raconte une histoire. Chaque créateur a une voix.
              Chaque achat soutient l&apos;artisanat local.
            </p>
            <Link
              href="/a-propos"
              className="mt-8 self-start border border-black px-8 py-3 font-[family-name:var(--font-montserrat)] text-[11px] font-medium uppercase tracking-[0.2em] transition-colors hover:bg-black hover:text-white"
            >
              Notre histoire →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
