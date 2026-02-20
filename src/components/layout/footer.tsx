import Link from "next/link";
import { Instagram, Linkedin } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const navItems = [
  { label: "CREATEURS", href: "/catalogue" },
  { label: "A PROPOS", href: "/a-propos" },
  { label: "SELECTION DU MOMENT", href: "/catalogue?promo=true" },
];

const legalItems = [
  { label: "MENTIONS LÉGALES", href: "/mentions-legales" },
  { label: "CGV", href: "/cgv" },
  { label: "CGU", href: "/cgu" },
];

function PinterestIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[16px] w-[16px]"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  );
}

const archivo = "font-[family-name:var(--font-archivo)]";

export function Footer() {
  return (
    <footer className="w-full bg-white text-black">
      {/* Double lignes en haut — même langage que le header */}
      <div className="h-[2px] w-full bg-black" />
      <div className="mt-1 h-[2px] w-full bg-black" />

      {/* ── Desktop ── */}
      <div className="hidden md:block">
        {/* Corps principal */}
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-12 px-10 py-8">
          {/* Zone 1 — Logo + Slogan */}
          <div>
            <Link
              href="/"
              className="inline-block text-black transition-opacity hover:opacity-60"
              aria-label="KPSULL — Accueil"
            >
              <Logo size="sm" className="text-black" />
            </Link>
            <p
              className={`${archivo} mt-4 text-[12px] font-medium uppercase tracking-[0.15em] text-black`}
            >
              L&apos;ANTIDOTE
              <br />
              A L&apos;UNIFORME.
            </p>
          </div>

          {/* Zone 2 — Navigation : liens en ligne, séparés par || */}
          <nav aria-label="Navigation footer" className="flex items-center gap-0">
            {navItems.map((item, index) => (
              <span key={item.href} className="flex items-center">
                {index > 0 && (
                  <span className="mx-4 flex gap-[3px]">
                    <span className="h-4 w-px bg-black/30" />
                    <span className="h-4 w-px bg-black/30" />
                  </span>
                )}
                <Link
                  href={item.href}
                  className={`${archivo} text-[13px] font-medium uppercase tracking-widest text-black transition-opacity hover:opacity-60`}
                >
                  {item.label}
                </Link>
              </span>
            ))}
          </nav>

          {/* Zone 3 — Contact + Social */}
          <div className="text-right">
            <span
              className={`${archivo} text-[10px] uppercase tracking-[0.2em] text-black/40`}
            >
              CONTACT
            </span>
            <a
              href="mailto:CONTACT@KPSULL.COM"
              className={`${archivo} mt-2 block text-[13px] font-semibold uppercase tracking-widest text-black underline-offset-4 hover:underline`}
            >
              CONTACT@KPSULL.COM
            </a>

            <span
              className={`${archivo} mt-5 block text-[10px] uppercase tracking-[0.2em] text-black/40`}
            >
              SUIVRE KPSULL
            </span>
            <div className="mt-2 flex items-center justify-end gap-4">
              <a
                href="https://instagram.com/kpsull"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-black transition-transform hover:scale-110"
              >
                <Instagram className="h-[16px] w-[16px]" strokeWidth={1.5} />
              </a>
              <a
                href="https://linkedin.com/company/kpsull"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-black transition-transform hover:scale-110"
              >
                <Linkedin className="h-[16px] w-[16px]" strokeWidth={1.5} />
              </a>
              <a
                href="https://pinterest.com/kpsull"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Pinterest"
                className="text-black transition-transform hover:scale-110"
              >
                <PinterestIcon />
              </a>
            </div>
          </div>
        </div>

        {/* Séparateur fin */}
        <div className="mx-10 border-t border-black/15" />

        {/* Bandeau copyright */}
        <div className="mx-auto flex max-w-7xl items-center justify-between px-10 py-4">
          {/* Gauche : copyright */}
          <div className="flex items-center">
            <span
              className={`${archivo} text-[11px] uppercase tracking-[0.15em] text-black/40`}
            >
              COPYRIGHT &copy; 2025 KPSULL
            </span>
          </div>

          {/* Droite : liens légaux */}
          <div className="flex items-center gap-3">
            {legalItems.map((item, index) => (
              <span key={item.href} className="flex items-center gap-3">
                {index > 0 && (
                  <span className={`${archivo} text-[11px] text-black/30`}>
                    &middot;
                  </span>
                )}
                <Link
                  href={item.href}
                  className={`${archivo} text-[11px] uppercase tracking-wider text-black/40 transition-colors hover:text-black/80`}
                >
                  {item.label}
                </Link>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="md:hidden">
        {/* Zone 1 — Logo + Slogan */}
        <div className="px-6 py-6">
          <Link
            href="/"
            className="inline-block text-black transition-opacity hover:opacity-60"
            aria-label="KPSULL — Accueil"
          >
            <Logo size="sm" className="text-black" />
          </Link>
          <p
            className={`${archivo} mt-4 text-[12px] font-medium uppercase tracking-[0.15em] text-black`}
          >
            L&apos;ANTIDOTE
            <br />
            A L&apos;UNIFORME.
          </p>
        </div>

        <div className="mx-6 border-t border-black/15" />

        {/* Zone 2 — Navigation */}
        <nav aria-label="Navigation footer mobile" className="px-6 py-6">
          <ul className="flex flex-col gap-3">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${archivo} text-[13px] font-medium uppercase tracking-widest text-black transition-opacity hover:opacity-60`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mx-6 border-t border-black/15" />

        {/* Zone 3 — Contact + Social */}
        <div className="px-6 py-6">
          <span
            className={`${archivo} text-[10px] uppercase tracking-[0.2em] text-black/40`}
          >
            CONTACT
          </span>
          <a
            href="mailto:CONTACT@KPSULL.COM"
            className={`${archivo} mt-2 block text-[13px] font-semibold uppercase tracking-widest text-black underline-offset-4 hover:underline`}
          >
            CONTACT@KPSULL.COM
          </a>

          <span
            className={`${archivo} mt-5 block text-[10px] uppercase tracking-[0.2em] text-black/40`}
          >
            SUIVRE KPSULL
          </span>
          <div className="mt-2 flex items-center gap-4">
            <a
              href="https://instagram.com/kpsull"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-black transition-transform hover:scale-110"
            >
              <Instagram className="h-[16px] w-[16px]" strokeWidth={1.5} />
            </a>
            <a
              href="https://linkedin.com/company/kpsull"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-black transition-transform hover:scale-110"
            >
              <Linkedin className="h-[16px] w-[16px]" strokeWidth={1.5} />
            </a>
            <a
              href="https://pinterest.com/kpsull"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Pinterest"
              className="text-black transition-transform hover:scale-110"
            >
              <PinterestIcon />
            </a>
          </div>
        </div>

        <div className="border-t border-black/15" />

        {/* Bandeau copyright mobile */}
        <div className="flex flex-col gap-2 px-6 py-4">
          <div className="flex items-center">
            <span
              className={`${archivo} text-[11px] uppercase tracking-[0.15em] text-black/40`}
            >
              COPYRIGHT &copy; 2025 KPSULL
            </span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {legalItems.map((item, index) => (
              <span key={item.href} className="flex items-center gap-3">
                {index > 0 && (
                  <span className={`${archivo} text-[11px] text-black/30`}>
                    &middot;
                  </span>
                )}
                <Link
                  href={item.href}
                  className={`${archivo} text-[11px] uppercase tracking-wider text-black/40 transition-colors hover:text-black/80`}
                >
                  {item.label}
                </Link>
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
