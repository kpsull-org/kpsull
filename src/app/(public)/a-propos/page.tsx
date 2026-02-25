import Image from "next/image";
import { Logo } from "@/components/brand/logo";
import { SectionSeparator } from "@/components/home/section-separator";

export const metadata = {
  title: "À propos — KPSULL",
  description:
    "Découvrez l'équipe KPSULL, notre histoire et notre mission : l'antidote à l'uniforme.",
};

const teamMembers: { name: string; email: string; photo: string }[] = [
  { name: "YUNUS", email: "yunus@kpsull.fr", photo: "https://res.cloudinary.com/damucxy2t/image/upload/v1771844757/kpsull/team/yunus.jpg" },
  { name: "DAMIEN", email: "damien@kpsull.fr", photo: "https://res.cloudinary.com/damucxy2t/image/upload/v1771844759/kpsull/team/damien.jpg" },
  { name: "CAROLINE", email: "caroline@kpsull.fr", photo: "https://res.cloudinary.com/damucxy2t/image/upload/v1771844760/kpsull/team/caroline.jpg" },
  { name: "ANTHONIN", email: "anthonin@kpsull.fr", photo: "https://res.cloudinary.com/damucxy2t/image/upload/v1771844762/kpsull/team/anthonin.jpg" },
  { name: "ELIOTT", email: "eliott@kpsull.fr", photo: "https://res.cloudinary.com/damucxy2t/image/upload/v1771844766/kpsull/team/eliott.jpg" },
  { name: "RÉMY", email: "remy@kpsull.fr", photo: "https://res.cloudinary.com/damucxy2t/image/upload/v1771844769/kpsull/team/remy.jpg" },
  { name: "ANTOINE", email: "antoine@kpsull.fr", photo: "https://res.cloudinary.com/damucxy2t/image/upload/v1771844349/kpsull/team/antoine.jpg" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white font-[family-name:var(--font-montserrat)]">
      {/* ─── HERO ─── */}
      <section className="relative -mt-[98px] h-screen w-full overflow-hidden">
        <Image
          src="/images/hero-about.png"
          alt="Coton et nature"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative flex h-full flex-col items-center justify-center gap-6 kp-luxury-reveal">
          <Logo
            size="xl"
            className="h-[160px] w-[160px] text-white md:h-[220px] md:w-[220px]"
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/80">
            L&apos;ANTIDOTE À L&apos;UNIFORME
          </p>
        </div>
      </section>

      {/* ─── L'ANTIDOTE À L'UNIFORME ─── */}
      <section className="px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-10 text-[11px] font-semibold uppercase tracking-[0.25em] text-black/40 kp-luxury-reveal">
            L&apos;ANTIDOTE À L&apos;UNIFORME
          </h2>
          <p className="text-xl font-light leading-[1.75] text-black md:text-2xl lg:text-[28px] lg:leading-[1.65] kp-luxury-reveal">
            Nous en avions assez. Assez des vêtements conçus pour être
            remplacés, des matières qui s&apos;usent à la troisième lessive, des
            pièces standardisées qui sortent de la même chaîne de production
            pour habiller des millions de personnes de façon identique. La mode
            s&apos;était perdue quelque part entre la quantité et le profit,
            laissant de côté ce qui fait sa vraie valeur&nbsp;: l&apos;intention,
            le geste, le savoir-faire. Pourtant, une alternative existait —
            des créateurs indépendants qui continuaient de travailler à la main,
            avec soin et avec âme. Le problème, c&apos;est qu&apos;il était
            presque impossible de les trouver.{" "}
            <strong className="font-semibold">
              KPSULL est né de ce constat
            </strong>{" "}
            : offrir un espace où la qualité artisanale devient enfin
            accessible, sans compromis.
          </p>
        </div>
      </section>

      <SectionSeparator className="bg-transparent" />

      {/* ─── L'ÉQUIPE ─── */}
      <section className="px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-20">
        <div className="mx-auto max-w-7xl">
        <h2 className="mb-10 text-[11px] font-semibold uppercase tracking-[0.25em] text-black kp-luxury-reveal">
          L&apos;ÉQUIPE
        </h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {teamMembers.map((member, idx) => (
            <div key={member.name} className={`group kp-scroll-reveal-delay-${(idx % 4) + 1}`}>
              {/* Photo */}
              <div className="mb-3 aspect-square w-full overflow-hidden bg-[#EBEBEB] kp-blur-in">
                <img
                  src={member.photo}
                  alt={member.name}
                  className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
                />
              </div>
              {/* Infos */}
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-black">
                {member.name}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-black/40">
                {member.email}
              </p>
            </div>
          ))}
        </div>
        </div>
      </section>

      <SectionSeparator className="bg-transparent" />

      {/* ─── NOTRE HISTOIRE ─── */}
      <section className="px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-10 text-[11px] font-semibold uppercase tracking-[0.25em] text-black/40 kp-luxury-reveal">
            NOTRE HISTOIRE
          </h2>
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <div className="space-y-6 text-base leading-[1.8] text-black/80 kp-luxury-reveal">
              <p>
                Tout a commencé sur les bancs de l&apos;école, autour
                d&apos;une frustration partagée&nbsp;: bien s&apos;habiller ne
                devrait pas être réservé à ceux qui savent chercher. Nous
                étions étudiants, passionnés de mode, et nous constations chaque
                jour à quel point il était difficile d&apos;accéder à des pièces
                qui valent vraiment quelque chose — fabriquées avec soin,
                pensées pour durer, portées avec intention.
              </p>
              <p>
                Dans le même temps, nous croisions des créateurs talentueux,
                des artisans brillants, qui passaient la majorité de leur temps
                non pas à créer, mais à se battre pour se rendre visibles. À
                publier, à répondre, à gérer des algorithmes. Du temps volé à
                leur art, pour des résultats incertains.
              </p>
              <p>
                C&apos;est là que KPSULL a pris forme. Une plateforme pensée
                pour que les créateurs indépendants puissent enfin se concentrer
                sur ce qu&apos;ils font de mieux — créer — pendant que nous
                nous occupons du reste. Les référencer, leur offrir une vitrine
                professionnelle, les connecter directement avec des personnes
                qui savent reconnaître la valeur d&apos;une pièce unique. Parce
                que la mode artisanale mérite d&apos;être vue, et ceux qui la
                portent méritent de la trouver facilement.
              </p>
            </div>
            <img
              src="https://res.cloudinary.com/damucxy2t/image/upload/v1771845067/kpsull/notre-histoire.jpg"
              alt="Notre histoire KPSULL"
              className="aspect-[4/5] w-full overflow-hidden border border-black object-cover md:aspect-auto kp-blur-in"
            />
          </div>
        </div>
      </section>

      <SectionSeparator className="bg-transparent" />

      {/* ─── ADRESSE ─── */}
      <section className="px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-black/40">
            ADRESSE
          </h2>
          <p className="mb-1 text-sm font-medium uppercase tracking-[0.15em] text-black/40">
            MyDigitalSchool Caen
          </p>
          <p className="mb-10 text-2xl font-semibold uppercase tracking-tight text-black md:text-3xl lg:text-[36px] kp-luxury-reveal">
            6 RUE DU RECTEUR DAURE,
            <br />
            14000 CAEN
          </p>
          <div className="aspect-video w-full overflow-hidden border border-black">
            <iframe
              title="Localisation KPSULL — 6 rue du recteur daure, Caen"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-0.3790%2C49.1845%2C-0.3590%2C49.1945&layer=mapnik&marker=49.1895%2C-0.3690"
              width="100%"
              height="100%"
              className="h-full w-full grayscale"
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
