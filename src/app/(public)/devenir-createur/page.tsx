import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Store, CreditCard, BarChart3, Shield, Palette, Users } from 'lucide-react';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Devenir Createur | Kpsull',
  description:
    'Rejoignez Kpsull en tant que createur. Vendez vos creations, gerez votre boutique et touchez des milliers de clients.',
};

const ADVANTAGES = [
  {
    icon: Store,
    title: 'Votre boutique en ligne',
    description:
      'Creez et personnalisez votre espace de vente en quelques minutes. Mettez en avant vos creations avec des photos et descriptions.',
  },
  {
    icon: CreditCard,
    title: 'Paiements securises',
    description:
      'Recevez vos paiements directement via Stripe. Virements rapides et suivi transparent de vos revenus.',
  },
  {
    icon: BarChart3,
    title: 'Tableau de bord complet',
    description:
      'Suivez vos ventes, gerez vos commandes et analysez vos performances avec des outils dedies.',
  },
  {
    icon: Users,
    title: 'Communaute active',
    description:
      'Rejoignez une communaute de createurs passionnes et touchez une audience de clients a la recherche de pieces uniques.',
  },
  {
    icon: Palette,
    title: 'Liberte creatrice',
    description:
      'Aucune restriction sur votre style. Streetstyle, classic, avant-garde... tous les univers sont les bienvenus.',
  },
  {
    icon: Shield,
    title: 'Protection vendeur',
    description:
      'Gestion des retours simplifiee, support dedie et protection contre les litiges pour vendre en toute serenite.',
  },
] as const;

const STEPS = [
  {
    number: '01',
    title: 'Inscrivez-vous',
    description: 'Creez votre compte Kpsull gratuitement en quelques secondes.',
  },
  {
    number: '02',
    title: 'Completez votre profil',
    description: 'Renseignez vos informations professionnelles et votre SIRET.',
  },
  {
    number: '03',
    title: 'Connectez Stripe',
    description: 'Configurez votre compte de paiement pour recevoir vos revenus.',
  },
  {
    number: '04',
    title: 'Commencez a vendre',
    description: 'Publiez vos premieres creations et accueillez vos premiers clients.',
  },
] as const;

export default async function DevenirCreateurPage() {
  let session = null;
  try {
    session = await auth();
  } catch {
    // JWT error — treat as unauthenticated
  }

  const isLoggedIn = !!session?.user;
  const isAlreadyCreator =
    session?.user?.role === 'CREATOR' || session?.user?.role === 'ADMIN';

  return (
    <div className="bg-[#D9D9D9]">
      {/* Hero */}
      <section className="bg-black px-6 py-20 text-center md:px-12 md:py-28 lg:py-32">
        <p className="font-[family-name:var(--font-montserrat)] text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
          Rejoignez Kpsull
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl font-[family-name:var(--font-montserrat)] text-3xl font-bold uppercase tracking-widest text-white md:text-4xl lg:text-5xl">
          Devenez Createur
        </h1>
        <p className="mx-auto mt-6 max-w-2xl font-[family-name:var(--font-archivo)] text-sm leading-relaxed text-gray-300 md:text-base">
          Vous etes createur, artisan ou designer ? Kpsull vous offre une plateforme pour
          vendre vos pieces uniques et toucher une communaute de passionnes.
        </p>
        <div className="mt-10">
          {isAlreadyCreator ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-[family-name:var(--font-montserrat)] text-sm font-semibold uppercase tracking-wider text-black transition-opacity hover:opacity-80"
            >
              Acceder a mon dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : isLoggedIn ? (
            <Link
              href="/onboarding/creator"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-[family-name:var(--font-montserrat)] text-sm font-semibold uppercase tracking-wider text-black transition-opacity hover:opacity-80"
            >
              Commencer l&apos;inscription
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-[family-name:var(--font-montserrat)] text-sm font-semibold uppercase tracking-wider text-black transition-opacity hover:opacity-80"
            >
              Creer mon compte
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>

      {/* Advantages */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-20 lg:px-20 lg:py-24">
        <h2 className="text-center font-[family-name:var(--font-montserrat)] text-2xl font-bold uppercase tracking-widest md:text-3xl">
          Pourquoi Kpsull ?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center font-[family-name:var(--font-archivo)] text-sm text-gray-600 md:text-base">
          Tout ce dont vous avez besoin pour lancer et developper votre activite de createur.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ADVANTAGES.map((advantage) => (
            <div
              key={advantage.title}
              className="rounded-2xl bg-white p-6 transition-shadow hover:shadow-md"
            >
              <advantage.icon className="h-8 w-8 text-black" />
              <h3 className="mt-4 font-[family-name:var(--font-montserrat)] text-sm font-bold uppercase tracking-wider">
                {advantage.title}
              </h3>
              <p className="mt-2 font-[family-name:var(--font-archivo)] text-sm leading-relaxed text-gray-600">
                {advantage.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-black px-6 py-16 md:px-12 md:py-20 lg:py-24">
        <h2 className="text-center font-[family-name:var(--font-montserrat)] text-2xl font-bold uppercase tracking-widest text-white md:text-3xl">
          Comment ca marche ?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center font-[family-name:var(--font-archivo)] text-sm text-gray-400 md:text-base">
          En 4 etapes simples, vous etes pret a vendre.
        </p>

        <div className="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.number} className="text-center">
              <span className="font-[family-name:var(--font-montserrat)] text-4xl font-bold text-white/20">
                {step.number}
              </span>
              <h3 className="mt-2 font-[family-name:var(--font-montserrat)] text-sm font-bold uppercase tracking-wider text-white">
                {step.title}
              </h3>
              <p className="mt-2 font-[family-name:var(--font-archivo)] text-sm leading-relaxed text-gray-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-20 lg:px-20 lg:py-24">
        <h2 className="text-center font-[family-name:var(--font-montserrat)] text-2xl font-bold uppercase tracking-widest md:text-3xl">
          Tarifs
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center font-[family-name:var(--font-archivo)] text-sm text-gray-600 md:text-base">
          Un modele simple et transparent, sans frais caches.
        </p>

        <div className="mx-auto mt-12 max-w-md">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="font-[family-name:var(--font-montserrat)] text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Lancement
            </p>
            <div className="mt-4 flex items-baseline justify-center gap-1">
              <span className="font-[family-name:var(--font-montserrat)] text-5xl font-bold">
                Gratuit
              </span>
            </div>
            <p className="mt-2 font-[family-name:var(--font-archivo)] text-sm text-gray-500">
              Commission de 10% par vente
            </p>

            <ul className="mt-8 space-y-3 text-left text-sm">
              {[
                'Boutique personnalisable',
                'Paiements via Stripe',
                'Tableau de bord complet',
                'Gestion des commandes et retours',
                'Support par email',
                'Pas de limite de produits',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-0.5 text-black">&#10003;</span>
                  <span className="font-[family-name:var(--font-archivo)] text-gray-700">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              {isAlreadyCreator ? (
                <Link
                  href="/dashboard"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-3 font-[family-name:var(--font-montserrat)] text-sm font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-80"
                >
                  Mon dashboard
                </Link>
              ) : isLoggedIn ? (
                <Link
                  href="/onboarding/creator"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-3 font-[family-name:var(--font-montserrat)] text-sm font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-80"
                >
                  Devenir createur
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href="/signup"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-3 font-[family-name:var(--font-montserrat)] text-sm font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-80"
                >
                  Commencer gratuitement
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-black px-6 py-16 text-center md:px-12 md:py-20">
        <h2 className="font-[family-name:var(--font-montserrat)] text-2xl font-bold uppercase tracking-widest text-white md:text-3xl">
          Pret a vous lancer ?
        </h2>
        <p className="mx-auto mt-4 max-w-lg font-[family-name:var(--font-archivo)] text-sm text-gray-400 md:text-base">
          Rejoignez la communaute de createurs Kpsull et commencez a vendre vos pieces uniques
          des aujourd&apos;hui.
        </p>
        <div className="mt-8">
          {isLoggedIn && !isAlreadyCreator ? (
            <Link
              href="/onboarding/creator"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-[family-name:var(--font-montserrat)] text-sm font-semibold uppercase tracking-wider text-black transition-opacity hover:opacity-80"
            >
              Commencer maintenant
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : !isLoggedIn ? (
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-[family-name:var(--font-montserrat)] text-sm font-semibold uppercase tracking-wider text-black transition-opacity hover:opacity-80"
            >
              Creer mon compte
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
