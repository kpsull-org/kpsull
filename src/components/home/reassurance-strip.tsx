function IconTruck() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-9 w-9"
      aria-hidden="true"
    >
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
      <rect x="9" y="11" width="14" height="10" rx="1" />
      <circle cx="12" cy="21" r="1.5" />
      <circle cx="20" cy="21" r="1.5" />
    </svg>
  );
}

function IconDiamond() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-9 w-9"
      aria-hidden="true"
    >
      <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z" />
    </svg>
  );
}

function IconLeaf() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-9 w-9"
      aria-hidden="true"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-9 w-9"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

const items = [
  { label: "LIVRAISON RAPIDE", sub: "Expédié sous 48h", Icon: IconTruck },
  { label: "PIÈCES UNIQUES", sub: "Éditions limitées", Icon: IconDiamond },
  { label: "ZÉRO GASPILLAGE", sub: "Mode responsable", Icon: IconLeaf },
  { label: "PAIEMENT SÉCURISÉ", sub: "Stripe certifié", Icon: IconLock },
];

export function ReassuranceStrip() {
  return (
    <section className="border-t-2 border-b-2 border-black bg-[#D6C8BD]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4">
        {items.map(({ label, sub, Icon }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-4 px-6 py-10 text-center md:py-12"
          >
            <Icon />
            <div>
              <p className="font-[family-name:var(--font-montserrat)] text-[11px] font-bold uppercase tracking-[0.2em]">
                {label}
              </p>
              <p className="mt-1 font-[family-name:var(--font-archivo)] text-[12px] text-black/60">
                {sub}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
