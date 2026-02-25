import { BeCreatorButton } from "@/components/home/be-creator-button";

const perks = [
  {
    title: "Commission à partir de 3%",
    desc: "L'une des plus basses du marché — et dégressif selon votre volume. Le reste reste entièrement pour vous.",
  },
  {
    title: "Une audience qui cherche ce que vous faites",
    desc: "Des acheteurs qui veulent activement des pièces uniques et artisanales — pas des vitrines génériques.",
  },
  {
    title: "Concentrez-vous sur la création",
    desc: "La vitrine, les paiements, la visibilité — on s'en occupe. Vous, vous créez.",
  },
];

export function CreatorCta() {
  return (
    <section className="kp-scroll-reveal border-t-2 border-black bg-[#F2F2F2] px-6 py-16 md:px-12 md:py-20 lg:px-20 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16 lg:gap-24">
          {/* Gauche : titre + description + CTA */}
          <div className="flex flex-col justify-between gap-10">
            <div>
              <p className="font-[family-name:var(--font-montserrat)] text-[11px] font-semibold uppercase tracking-[0.25em] text-black/40">
                REJOINDRE LA COMMUNAUTÉ
              </p>
              <h2 className="mt-4 font-[family-name:var(--font-montserrat)] text-4xl font-black uppercase leading-[1.05] tracking-tight text-black md:text-5xl lg:text-[56px]">
                DEVENEZ
                <br />
                CRÉATEUR
              </h2>
              <p className="mt-5 font-[family-name:var(--font-archivo)] text-sm leading-relaxed text-black/60">
                Rejoignez Kpsull et vendez vos créations à une communauté de
                passionnés. Nous gérons la vitrine, les paiements et la
                visibilité — vous vous concentrez sur votre art.
              </p>
            </div>
            <BeCreatorButton className="self-start border border-black bg-black px-10 py-4 font-[family-name:var(--font-montserrat)] text-[11px] font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-black">
              Commencer maintenant →
            </BeCreatorButton>
          </div>

          {/* Droite : 3 avantages */}
          <div className="flex flex-col justify-center divide-y divide-black/10">
            {perks.map((perk) => (
              <div key={perk.title} className="py-7">
                <p className="font-[family-name:var(--font-montserrat)] text-base font-bold uppercase tracking-tight text-black">
                  {perk.title}
                </p>
                <p className="mt-1.5 font-[family-name:var(--font-archivo)] text-sm leading-relaxed text-black/50">
                  {perk.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
