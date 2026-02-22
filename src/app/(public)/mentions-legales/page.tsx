import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions Légales - KPSULL",
  description:
    "Mentions légales de la plateforme KPSULL : éditeur, hébergement, propriété intellectuelle et données personnelles.",
};

export default function MentionsLegalesPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 md:px-12 lg:px-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-[family-name:var(--font-archivo)] text-2xl font-bold uppercase tracking-wide mb-12">
          MENTIONS LÉGALES
        </h1>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            1. ÉDITEUR DU SITE
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            Le site kpsull.com est édité par la société KPSULL, SAS au capital social défini dans ses statuts.
          </p>
          <ul className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4 space-y-1">
            <li>
              <span className="font-semibold">Raison sociale :</span> KPSULL
            </li>
            <li>
              <span className="font-semibold">Forme juridique :</span> SAS (Société par Actions Simplifiée)
            </li>
            <li>
              <span className="font-semibold">Siège social :</span> 666 KPSULLSTREET, 14000 CAEN, France
            </li>
            <li>
              <span className="font-semibold">Email :</span>{' '}
              <a
                href="mailto:CONTACT@KPSULL.COM"
                className="underline hover:no-underline"
              >
                CONTACT@KPSULL.COM
              </a>
            </li>
            <li>
              <span className="font-semibold">Directeur de publication :</span> L&apos;équipe KPSULL
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            2. HÉBERGEMENT
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            Le site est hébergé par :
          </p>
          <ul className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4 space-y-1">
            <li>
              <span className="font-semibold">Hébergeur :</span> Railway (railway.app)
            </li>
            <li>
              <span className="font-semibold">Adresse :</span> Railway Inc., 340 Pine Street, Suite 800, San Francisco, CA 94104, USA
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            3. PROPRIÉTÉ INTELLECTUELLE
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            L&apos;ensemble des contenus présents sur le site kpsull.com (textes, images, logos, design, structure) sont protégés par le droit d&apos;auteur et restent la propriété exclusive de KPSULL ou de ses créateurs partenaires.
          </p>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable de KPSULL. Toute exploitation non autorisée constitue une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            4. DONNÉES PERSONNELLES
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            KPSULL est responsable du traitement des données personnelles collectées sur la plateforme.
          </p>
          <ul className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4 space-y-2">
            <li>
              <span className="font-semibold">Responsable de traitement :</span> KPSULL
            </li>
            <li>
              <span className="font-semibold">Finalités :</span> gestion des comptes utilisateurs, traitement des commandes, envoi de newsletters et communications commerciales.
            </li>
            <li>
              <span className="font-semibold">Droits :</span> conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation et de portabilité de vos données personnelles. Pour exercer ces droits, contactez-nous à{' '}
              <a
                href="mailto:CONTACT@KPSULL.COM"
                className="underline hover:no-underline"
              >
                CONTACT@KPSULL.COM
              </a>
              .
            </li>
            <li>
              <span className="font-semibold">Conformité :</span> le traitement de vos données est conforme au RGPD (Règlement UE 2016/679) et à la loi Informatique et Libertés du 6 janvier 1978 modifiée.
            </li>
          </ul>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            En cas de réclamation, vous pouvez également contacter la CNIL (Commission Nationale de l&apos;Informatique et des Libertés) : www.cnil.fr.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            5. COOKIES
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            Le site kpsull.com utilise des cookies fonctionnels nécessaires au bon fonctionnement du service et des cookies analytiques permettant d&apos;améliorer l&apos;expérience utilisateur.
          </p>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            Vous pouvez à tout moment refuser les cookies non essentiels en modifiant les paramètres de votre navigateur. Le refus des cookies fonctionnels peut toutefois affecter le bon fonctionnement de certaines pages du site.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            6. CONTACT
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter à l&apos;adresse suivante :{' '}
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
