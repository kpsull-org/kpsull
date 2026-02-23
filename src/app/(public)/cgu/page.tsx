import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation - KPSULL",
  description:
    "Conditions générales d'utilisation de la plateforme KPSULL : accès au service, création de compte, comptes créateurs et règles de comportement.",
};

export default function CGUPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 md:px-12 lg:px-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-[family-name:var(--font-archivo)] text-2xl font-bold uppercase tracking-wide mb-12">
          CONDITIONS GÉNÉRALES D&apos;UTILISATION
        </h1>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            1. OBJET
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            Les présentes Conditions Générales d&apos;Utilisation (CGU) définissent les conditions d&apos;accès et d&apos;utilisation de la plateforme KPSULL accessible à l&apos;adresse kpsull.com, éditée par la société KPSULL, SAS dont le siège social est situé 666 KPSULLSTREET, 14000 CAEN, France.
          </p>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            Toute utilisation de la plateforme implique l&apos;acceptation pleine et entière des présentes CGU. Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser le service.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            2. ACCÈS AU SERVICE
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            Le site kpsull.com est accessible 24h/24 et 7j/7, sauf en cas de maintenance ou d&apos;opération de mise à jour. KPSULL se réserve le droit de suspendre temporairement l&apos;accès au service pour des raisons techniques sans que cela ouvre droit à indemnisation.
          </p>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            KPSULL s&apos;engage à informer les utilisateurs des maintenances planifiées dans un délai raisonnable.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            3. CRÉATION DE COMPTE
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            Pour accéder à certaines fonctionnalités de la plateforme (achat, favoris, suivi de commandes), la création d&apos;un compte est requise. L&apos;inscription est réservée aux personnes physiques majeures (18 ans et plus).
          </p>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            Lors de l&apos;inscription, vous vous engagez à fournir des informations exactes, complètes et à jour. Vos identifiants de connexion sont strictement personnels et confidentiels : vous êtes seul responsable de leur utilisation et de la sécurité de votre compte. Toute utilisation frauduleuse de votre compte doit être signalée immédiatement à{' '}
            <a
              href="mailto:CONTACT@KPSULL.COM"
              className="underline hover:no-underline"
            >
              CONTACT@KPSULL.COM
            </a>
            {'.'}
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            4. COMPTES CRÉATEURS
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            Les créateurs souhaitant vendre leurs productions sur la plateforme doivent faire une demande d&apos;accès et accepter les conditions spécifiques applicables aux vendeurs. En tant que créateur, vous vous engagez à :
          </p>
          <ul className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4 space-y-2 list-disc list-inside">
            <li>
              Proposer exclusivement des créations originales dont vous êtes l&apos;auteur ou disposez des droits nécessaires.
            </li>
            <li>
              Respecter les droits de propriété intellectuelle des tiers : toute mise en vente d&apos;articles copiés ou contrefaits est strictement interdite.
            </li>
            <li>
              Fournir des informations exactes sur vos produits (description, matières, tailles, délais de fabrication).
            </li>
          </ul>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            KPSULL prélève une commission sur chaque vente réalisée via la plateforme. Le taux de commission et les modalités de versement sont détaillés dans le tableau de bord créateur et peuvent être mis à jour avec préavis.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            5. COMPORTEMENT UTILISATEUR
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            En utilisant la plateforme KPSULL, vous vous engagez à ne pas :
          </p>
          <ul className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4 space-y-2 list-disc list-inside">
            <li>Publier ou transmettre tout contenu illicite, offensant, discriminatoire, diffamatoire ou portant atteinte à la vie privée d&apos;autrui.</li>
            <li>Utiliser la plateforme à des fins frauduleuses ou à des fins contraires à l&apos;ordre public.</li>
            <li>Effectuer du spam, du phishing ou toute tentative d&apos;atteinte aux systèmes informatiques de KPSULL ou de tiers.</li>
            <li>Usurper l&apos;identité d&apos;un autre utilisateur ou de KPSULL.</li>
            <li>Scraper, extraire ou collecter automatiquement des données du site sans autorisation.</li>
          </ul>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            KPSULL se réserve le droit de suspendre ou de supprimer tout compte contrevenant aux présentes CGU, sans préavis ni indemnité.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            6. PROPRIÉTÉ INTELLECTUELLE
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            Les créateurs conservent l&apos;intégralité des droits de propriété intellectuelle sur leurs créations publiées sur KPSULL. En publiant des contenus (photos, descriptions, visuels) sur la plateforme, le créateur accorde à KPSULL une licence d&apos;affichage non-exclusive, mondiale et gratuite, pour les besoins du fonctionnement et de la promotion de la plateforme.
          </p>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            La structure, le design et les éléments de marque de la plateforme kpsull.com demeurent la propriété exclusive de KPSULL et ne peuvent être reproduits sans autorisation écrite préalable.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            7. DONNÉES PERSONNELLES
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            KPSULL collecte uniquement les données personnelles strictement nécessaires au fonctionnement du service (nom, adresse email, adresse postale pour la livraison). Ces données ne sont pas vendues à des tiers.
          </p>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            Le traitement de vos données est conforme au Règlement Général sur la Protection des Données (RGPD). Pour toute demande relative à vos données personnelles (accès, rectification, suppression), veuillez consulter nos{' '}
            <a
              href="/mentions-legales"
              className="underline hover:no-underline"
            >
              Mentions Légales
            </a>{' '}
            ou nous contacter à{' '}
            <a
              href="mailto:CONTACT@KPSULL.COM"
              className="underline hover:no-underline"
            >
              CONTACT@KPSULL.COM
            </a>
            {'.'}
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            8. LIMITATION DE RESPONSABILITÉ
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            KPSULL agit en qualité de plateforme intermédiaire facilitant la mise en relation entre acheteurs et créateurs vendeurs. À ce titre, la responsabilité relative à la qualité, la conformité et la sécurité des produits incombe en premier lieu aux créateurs vendeurs.
          </p>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            KPSULL ne saurait être tenu responsable des contenus publiés par les créateurs (photos, descriptions, avis), ni des dommages directs ou indirects résultant de l&apos;utilisation ou de l&apos;impossibilité d&apos;utilisation du service.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            9. MODIFICATION DES CGU
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            KPSULL se réserve le droit de modifier les présentes CGU à tout moment, notamment pour s&apos;adapter à l&apos;évolution du service ou du cadre réglementaire. Les utilisateurs seront informés des modifications substantielles par email et/ou par une notification sur la plateforme. La poursuite de l&apos;utilisation du service après notification vaut acceptation des nouvelles conditions.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            10. DROIT APPLICABLE ET JURIDICTION
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            Les présentes CGU sont soumises au droit français. En cas de litige non résolu à l&apos;amiable, le Tribunal de Commerce de Caen sera seul compétent.
          </p>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            Pour toute question ou réclamation :{' '}
            <a
              href="mailto:CONTACT@KPSULL.COM"
              className="underline hover:no-underline"
            >
              CONTACT@KPSULL.COM
            </a>
          </p>
        </section>

        <p className="font-[family-name:var(--font-montserrat)] text-sm text-gray-500 mt-16">
          Dernière mise à jour : 2025 — KPSULL, 666 KPSULLSTREET, 14000 CAEN, France
        </p>
      </div>
    </main>
  );
}
