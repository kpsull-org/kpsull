import Link from "next/link";
import { ArrowRight, Store, ShieldCheck, Settings } from "lucide-react";

const highlights = [
  {
    icon: Store,
    label: "Boutique personnalisee",
  },
  {
    icon: ShieldCheck,
    label: "Paiements securises via Stripe",
  },
  {
    icon: Settings,
    label: "Outils de gestion avances",
  },
] as const;

export function BecomeCreatorCTA() {
  return (
    <section className="bg-background px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-[family-name:var(--font-montserrat)] text-lg font-bold md:text-xl lg:text-2xl">
          Devenez Createur sur Kpsull
        </h2>

        <p className="mx-auto mt-4 max-w-xl font-[family-name:var(--font-archivo)] text-sm leading-relaxed text-muted-foreground md:text-base">
          Rejoignez notre communaute de createurs et vendez vos produits
          artisanaux a des milliers de clients.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          {highlights.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-sm text-muted-foreground md:text-base"
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="font-[family-name:var(--font-archivo)]">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/onboarding/creator"
            className="inline-flex items-center gap-2 rounded-full bg-black px-8 py-3 font-[family-name:var(--font-montserrat)] text-sm font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-80"
          >
            Devenir Createur
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
