import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { TartanStripe } from "@/components/brand/tartan-stripe";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "CREATEURS", href: "/catalogue" },
  { label: "A PROPOS", href: "/a-propos" },
  { label: "SELECTION DU MOMENT", href: "/catalogue?promo=true" },
];

export function Footer() {
  return (
    <footer className="relative w-full">
      {/* Top tartan stripe */}
      <TartanStripe />

      {/* Main footer content */}
      <div className="bg-white px-6 py-12 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          {/* Top section: Logo + Contact */}
          <div className="mb-12 flex flex-col items-start gap-12 md:flex-row md:items-start md:justify-between">
            {/* Left column: Logo + Slogan */}
            <div className="flex flex-col gap-4">
              <div className="text-kpsull-green">
                <Logo size="xl" className="w-[120px] h-[120px] md:w-[199px] md:h-[200px]" />
              </div>
              <p className="font-[family-name:var(--font-montserrat)] font-semibold text-xl text-kpsull-green md:text-2xl">
                L'ANTIDOTE A L'UNIFORME.
              </p>
            </div>

            {/* Right column: Contact */}
            <div className="flex flex-col gap-4">
              <h2 className="font-[family-name:var(--font-archivo)] font-medium text-[18px] uppercase tracking-wide text-black md:text-[20px]">
                CONTACTEZ L'EQUIPE KPSULL
              </h2>
              <a
                href="mailto:CONTACT@KPSULL.COM"
                className="font-[family-name:var(--font-archivo)] font-medium text-2xl text-kpsull-link transition-opacity hover:opacity-70 md:text-[40px]"
              >
                CONTACT@KPSULL.COM
              </a>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="mb-12 flex flex-col items-start gap-6 md:flex-row md:items-center md:gap-8">
            {navItems.map((item, index) => (
              <div key={item.href} className="flex items-center gap-8">
                <Link
                  href={item.href}
                  className={cn(
                    "font-[family-name:var(--font-archivo)] font-medium text-[18px] md:text-[20px] text-kpsull-link hover:opacity-70 transition-opacity tracking-wide"
                  )}
                >
                  {item.label}
                </Link>
                {index < navItems.length - 1 && (
                  <span className="hidden text-kpsull-link md:inline">|</span>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom bar: Copyright + Decorative text */}
      <div className="relative bg-white pb-20">
        {/* Copyright centered */}
        <div className="relative z-10 text-center">
          <p className="font-[family-name:var(--font-archivo)] font-medium text-[18px] md:text-[20px] text-kpsull-green">
            COPYRIGHT 2025
          </p>
        </div>

        {/* Decorative "KPSULL" text at bottom */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
          <div className="flex justify-center">
            <p
              className="font-[family-name:var(--font-archivo)] font-bold text-[80px] leading-none text-kpsull-pink opacity-20 md:text-[120px]"
              aria-hidden="true"
            >
              KPSULL
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
