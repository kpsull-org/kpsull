import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente - KPSULL",
  description:
    "Conditions générales de vente de la plateforme KPSULL : commandes, paiement, livraison, droit de rétractation et garanties.",
};

export default function CGVPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 md:px-12 lg:px-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-[family-name:var(--font-archivo)] text-2xl font-bold uppercase tracking-wide mb-12">
          CONDITIONS GÉNÉRALES DE VENTE
        </h1>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            1. OBJET ET CHAMP D&apos;APPLICATION
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            KPSULL est une plateforme e-commerce mettant en relation des acheteurs et des créateurs de mode indépendants basés en France. Les présentes Conditions Générales de Vente (CGV) s&apos;appliquent à toute commande passée sur le site kpsull.com et régissent les relations contractuelles entre KPSULL, ses créateurs partenaires et les acheteurs.
          </p>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            Toute commande implique l&apos;acceptation pleine et entière des présentes CGV. KPSULL se réserve le droit de les modifier à tout moment ; les CGV applicables sont celles en vigueur au moment de la validation de la commande.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            2. PRODUITS
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            Les produits proposés sur kpsull.com sont créés par des créateurs partenaires indépendants. Chaque article est fabriqué de manière artisanale ou en petite série, ce qui lui confère un caractère unique.
          </p>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            Les photographies illustrant les produits sont non contractuelles. De légères variations de teinte ou de texture peuvent exister entre la représentation photographique et le produit réel, inhérentes aux caractéristiques des matières utilisées et aux conditions de prise de vue. Les prix sont indiqués en euros toutes taxes comprises (TTC).
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            3. COMMANDES
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            La commande est définitivement validée après confirmation du paiement. Un email de confirmation récapitulatif est envoyé à l&apos;adresse email renseignée lors de la commande.
          </p>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            KPSULL se réserve le droit d&apos;annuler toute commande en cas de suspicion de fraude, d&apos;erreur manifeste sur le prix ou la disponibilité d&apos;un produit, ou de toute situation anormale. Dans ce cas, l&apos;acheteur sera informé par email et remboursé intégralement dans les meilleurs délais.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            4. PRIX ET PAIEMENT
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            Tous les prix affichés sur le site sont exprimés en euros toutes taxes comprises (TTC). Les frais de livraison, affichés au moment de la commande, s&apos;ajoutent au prix des produits.
          </p>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            Le paiement s&apos;effectue en ligne de manière sécurisée par carte bancaire via la solution de paiement Stripe. Aucun frais supplémentaire caché n&apos;est appliqué. Les données bancaires ne sont pas conservées par KPSULL.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            5. LIVRAISON
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            Les commandes sont préparées et expédiées par les créateurs partenaires dans un délai de 3 à 5 jours ouvrés à compter de la confirmation de paiement. La livraison en France métropolitaine s&apos;effectue dans un délai de 5 à 10 jours ouvrés supplémentaires.
          </p>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            Les frais de livraison sont calculés et affichés au moment de la validation du panier. KPSULL ne peut être tenu responsable des retards de livraison imputables au transporteur ou à des événements indépendants de sa volonté (grèves, intempéries, etc.).
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            6. DROIT DE RÉTRACTATION
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            Conformément à l&apos;article L221-18 du Code de la consommation, vous disposez d&apos;un délai de 14 jours à compter de la réception de votre commande pour exercer votre droit de rétractation, sans avoir à justifier de motif.
          </p>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            Pour exercer ce droit, contactez-nous à{" "}
            <a
              href="mailto:CONTACT@KPSULL.COM"
              className="underline hover:no-underline"
            >
              CONTACT@KPSULL.COM
            </a>{" "}
            avant l&apos;expiration du délai. Les articles doivent être retournés dans leur état d&apos;origine, non portés, avec leurs étiquettes, à l&apos;adresse indiquée dans le bon de livraison. Les frais de retour sont à la charge de l&apos;acheteur, sauf erreur de notre part.
          </p>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            Le remboursement intégral du montant de la commande (hors frais de retour) sera effectué dans un délai de 14 jours à compter de la réception des articles retournés.
          </p>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            Conformément à l&apos;article L221-28 du Code de la consommation, le droit de rétractation ne s&apos;applique pas aux articles personnalisés ou confectionnés selon les spécifications de l&apos;acheteur.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            7. GARANTIES
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            Tous les produits vendus sur kpsull.com bénéficient de la garantie légale de conformité (articles L217-4 et suivants du Code de la consommation) d&apos;une durée de 2 ans à compter de la délivrance du bien, ainsi que de la garantie contre les vices cachés (articles 1641 et suivants du Code civil).
          </p>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            En cas de défaut de conformité ou de vice caché, contactez-nous à{" "}
            <a
              href="mailto:CONTACT@KPSULL.COM"
              className="underline hover:no-underline"
            >
              CONTACT@KPSULL.COM
            </a>{" "}
            avec une description du problème et des photographies du produit concerné.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            8. RESPONSABILITÉ
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            KPSULL ne peut être tenu responsable des retards ou inexécutions liés à un cas de force majeure, à un événement imprévisible ou indépendant de sa volonté. La responsabilité de KPSULL est limitée au montant de la commande concernée.
          </p>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            En cas de litige, nous vous invitons à nous contacter en priorité à{" "}
            <a
              href="mailto:CONTACT@KPSULL.COM"
              className="underline hover:no-underline"
            >
              CONTACT@KPSULL.COM
            </a>{" "}
            afin de trouver une solution amiable.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            9. RÈGLEMENT DES LITIGES
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            En cas de litige non résolu à l&apos;amiable, vous pouvez recourir gratuitement à la médiation du e-commerce proposée par la Fédération du e-commerce et de la vente à distance (FEVAD) : www.mediateurfevad.fr.
          </p>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            Conformément à l&apos;article 14 du Règlement européen n°524/2013, vous pouvez également recourir à la plateforme de résolution des litiges en ligne de la Commission européenne : ec.europa.eu/consumers/odr.
          </p>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-4">
            À défaut de résolution amiable, le tribunal compétent est le Tribunal de Commerce de Caen, conformément aux dispositions légales applicables.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-archivo)] font-semibold uppercase tracking-wide text-lg mb-4 border-b border-black pb-2">
            10. CONTACT
          </h2>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800">
            Pour toute question relative à une commande ou aux présentes CGV :{" "}
            <a
              href="mailto:CONTACT@KPSULL.COM"
              className="underline hover:no-underline"
            >
              CONTACT@KPSULL.COM
            </a>
          </p>
          <p className="font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-gray-800 mt-2">
            KPSULL — 666 KPSULLSTREET, 14000 CAEN, France
          </p>
        </section>

        <p className="font-[family-name:var(--font-montserrat)] text-sm text-gray-500 mt-16">
          Dernière mise à jour : 2025 — KPSULL, 666 KPSULLSTREET, 14000 CAEN, France
        </p>
      </div>
    </main>
  );
}
