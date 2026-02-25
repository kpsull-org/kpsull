import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    id: "item-1",
    question: "Comment fonctionne la plateforme ?",
    answer:
      "KPSULL est une plateforme qui met en relation des createurs de mode locaux avec des passionnes de mode. Parcourez les collections de nos createurs, selectionnez vos pieces favorites et commandez directement aupres du createur.",
  },
  {
    id: "item-2",
    question: "Quels types de createurs puis-je trouver sur la plateforme ?",
    answer:
      "Vous trouverez des createurs aux styles varies : streetwear, vintage, minimaliste, boheme, techwear et bien d'autres. Chaque createur apporte sa vision unique de la mode.",
  },
  {
    id: "item-3",
    question: "Comment passer une commande ?",
    answer:
      "Selectionnez vos articles, choisissez votre taille, ajoutez-les au panier et procedez au paiement securise. Le createur preparera votre commande avec soin.",
  },
  {
    id: "item-4",
    question: "Quels sont les delais de livraison ?",
    answer:
      "Les delais varient selon le createur, generalement entre 3 et 10 jours ouvrables. Chaque piece etant souvent faite a la main, les delais peuvent varier.",
  },
  {
    id: "item-5",
    question: "Puis-je retourner un article si je ne suis pas satisfait(e) ?",
    answer:
      "Oui, vous disposez de 14 jours apres reception pour retourner un article. Consultez notre politique de retour pour les conditions detaillees.",
  },
];

export function FAQSection() {
  return (
    <section className="kp-scroll-reveal bg-[#F2F2F2] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-10 font-[family-name:var(--font-montserrat)] text-lg font-semibold uppercase md:text-xl lg:text-2xl">
          FAQ
        </h2>

        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="border-b border-black"
            >
              <AccordionTrigger className="py-6 text-left font-[family-name:var(--font-montserrat)] text-base font-semibold md:text-lg">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="pb-6 font-[family-name:var(--font-montserrat)] text-base leading-relaxed text-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
