const STEP_DELAY_CLASSES = [
  "kp-scroll-reveal-delay-1",
  "kp-scroll-reveal-delay-2",
  "kp-scroll-reveal-delay-3",
] as const;

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "EXPLOREZ",
      description:
        "Parcourez des centaines de pièces uniques créées par des artisans et créateurs locaux français.",
    },
    {
      number: "02",
      title: "CHOISISSEZ",
      description:
        "Sélectionnez la pièce qui vous correspond. Chaque article est une édition limitée.",
    },
    {
      number: "03",
      title: "RECEVEZ",
      description:
        "Votre commande est préparée et expédiée directement par le créateur. Livraison rapide.",
    },
  ];

  return (
    <section className="border-t-2 border-black bg-white px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="kp-scroll-reveal mb-10 flex items-end justify-between md:mb-12">
          <h2 className="font-[family-name:var(--font-montserrat)] text-lg font-semibold uppercase md:text-xl lg:text-2xl">
            COMMENT ÇA MARCHE ?
          </h2>
          <span className="hidden font-[family-name:var(--font-montserrat)] text-[11px] uppercase tracking-[0.2em] text-black/40 md:block">
            Simple. Rapide. Local.
          </span>
        </div>

        <div className="grid grid-cols-1 gap-0 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`${STEP_DELAY_CLASSES[i]} border-t-2 border-black pt-6 pb-8 md:pt-8 md:pb-10 ${
                i < 2 ? "md:border-r-2 md:pr-8 lg:pr-12" : ""
              } ${i > 0 ? "md:pl-8 lg:pl-12" : ""}`}
            >
              <span className="font-[family-name:var(--font-jacquard-12)] text-5xl font-normal leading-none text-[#EFD050] md:text-6xl">
                {step.number}
              </span>
              <h3 className="mt-4 font-[family-name:var(--font-montserrat)] text-sm font-bold uppercase tracking-[0.15em]">
                {step.title}
              </h3>
              <p className="mt-2 font-[family-name:var(--font-archivo)] text-sm leading-relaxed text-black/60">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
