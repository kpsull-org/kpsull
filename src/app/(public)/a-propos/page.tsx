import Image from "next/image";
import { Logo } from "@/components/brand/logo";
import { TartanStripe } from "@/components/brand/tartan-stripe";

export const metadata = {
  title: "A propos - KPSULL",
  description:
    "Decouvrez l'equipe KPSULL, notre histoire et notre mission : l'antidote a l'uniforme.",
};

const teamMembers = [
  { name: "YUNUS", style: "VINTAGE" },
  { name: "SARAH", style: "STREET" },
  { name: "LUCAS", style: "MINIMALISTE" },
  { name: "EMMA", style: "TECHWEAR" },
  { name: "NOAH", style: "BOHEME" },
  { name: "LEILA", style: "CLASSIC" },
  { name: "RAYAN", style: "AVANT-GARDE" },
  { name: "CLARA", style: "SPORTIF" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      {/* Section 1: Hero -- full-screen nature image + K logo overlay */}
      <section className="relative -mt-[98px] h-screen w-full overflow-hidden">
        <Image
          src="/images/hero-about.png"
          alt="Coton et nature"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative flex h-full items-center justify-center">
          <Logo
            size="xl"
            className="h-[200px] w-[200px] text-white/90 md:h-[300px] md:w-[300px]"
          />
        </div>
        <TartanStripe className="absolute bottom-0 left-0 right-0" />
      </section>

      {/* Section 2: Mission -- Figma: title + text + fashion images */}
      <section className="bg-[#D9D9D9] px-6 py-16 md:px-12 md:py-24 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-8 font-[family-name:var(--font-montserrat)] text-2xl font-semibold uppercase md:text-3xl lg:text-[40px] lg:leading-[1.22]">
            L&apos;ANTIDOTE A L&apos;UNIFORME.
          </h1>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed md:text-lg">
                KPSULL est une plateforme qui celebre la mode authentique en
                connectant des createurs locaux passionnes avec des amateurs de
                pieces uniques. Nous croyons que chaque vetement raconte une
                histoire et que la mode devrait etre une expression de soi, pas
                un uniforme.
              </p>
              <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed md:text-lg">
                Notre mission est de fournir un espace ou l&apos;artisanat
                rencontre l&apos;innovation, ou chaque piece est le reflet
                d&apos;un savoir-faire unique et d&apos;une vision creative
                singuliere.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-[3/4] overflow-hidden rounded-lg bg-secondary">
                <div className="h-full w-full bg-gradient-to-br from-gray-300 to-gray-400" />
              </div>
              <div className="aspect-[3/4] overflow-hidden rounded-lg bg-secondary">
                <div className="h-full w-full bg-gradient-to-br from-gray-300 to-gray-400" />
              </div>
            </div>
          </div>
          <div className="mt-16 h-px bg-black" />
        </div>
      </section>

      {/* Section 3: L'Equipe -- Figma: 4x2 grid of team photos */}
      <section className="bg-[#D9D9D9] px-6 py-16 md:px-12 md:py-24 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 font-[family-name:var(--font-montserrat)] text-xl font-semibold uppercase md:text-2xl lg:text-[40px] lg:leading-[1.22]">
            L&apos;EQUIPE
          </h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {teamMembers.map((member) => (
              <div key={member.name} className="group">
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-secondary">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400" />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.6) 100%)",
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-[family-name:var(--font-montserrat)] text-lg font-bold uppercase text-white">
                      {member.name}
                    </h3>
                    <p className="font-[family-name:var(--font-montserrat)] text-sm uppercase text-[#EFD050]">
                      {member.style}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Notre Histoire -- Figma: text + images */}
      <section className="bg-[#D9D9D9] px-6 py-16 md:px-12 md:py-24 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 font-[family-name:var(--font-montserrat)] text-xl font-semibold uppercase md:text-2xl lg:text-[40px] lg:leading-[1.22]">
            NOTRE HISTOIRE
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed md:text-lg">
                Tout a commence a Caen, en Normandie, ou un groupe de
                passionnes de mode s&apos;est reuni autour d&apos;une vision
                commune : rendre la mode artisanale accessible a tous.
              </p>
              <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed md:text-lg">
                Lasses des vetements standardises et de la fast fashion, nous
                avons decide de creer un espace ou les createurs locaux
                pourraient partager leur art directement avec ceux qui
                l&apos;apprecient.
              </p>
              <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed md:text-lg">
                KPSULL est ne de cette volonte de reconnecter la mode avec ses
                racines artisanales. Chaque createur que nous accompagnons
                apporte une vision unique, un savoir-faire et une histoire qui
                se retrouvent dans chaque piece.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-[3/4] overflow-hidden rounded-lg bg-secondary">
                <div className="h-full w-full bg-gradient-to-br from-gray-300 to-gray-400" />
              </div>
              <div className="aspect-[3/4] overflow-hidden rounded-lg bg-secondary">
                <div className="h-full w-full bg-gradient-to-br from-gray-300 to-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Adresse + Carte -- Figma: address with map */}
      <section className="bg-[#D9D9D9] px-6 py-16 md:px-12 md:py-24 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-2 font-[family-name:var(--font-montserrat)] text-sm font-medium uppercase tracking-wider text-muted-foreground">
            ADRESSE
          </h2>
          <p className="mb-8 font-[family-name:var(--font-montserrat)] text-xl font-semibold md:text-[36px]">
            666 KPSULLSTREET, 14000 CAEN
          </p>
          <div className="aspect-video overflow-hidden rounded-xl bg-muted">
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
              <p className="font-[family-name:var(--font-montserrat)] text-lg text-muted-foreground">
                Carte Normandie - Caen
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
