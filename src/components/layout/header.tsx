"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, LogIn, Package, Store, LogOut, ShoppingCart } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { CartDropdown } from "@/components/layout/cart-dropdown";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "CATALOGUE", href: "/catalogue" },
  { label: "CREATEURS", href: "/createurs" },
  { label: "A PROPOS", href: "/a-propos" },
];

interface HeaderProps {
  user?: {
    name?: string | null;
    image?: string | null;
    role?: string;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAuthenticated = !!user;
  const accountHref = isAuthenticated ? "/mon-compte" : "/login";
  const AccountIcon = isAuthenticated ? User : LogIn;
  const isAdmin = user?.role === "ADMIN";
  const hasShopAccess = user?.role === "CREATOR" || isAdmin;

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      {/* ─── Mobile fullscreen overlay menu ─── */}
      <div
        aria-hidden={!isMenuOpen}
        className={cn(
          "fixed inset-0 z-[100] bg-black text-white flex flex-col md:hidden",
          isMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        style={{
          clipPath: isMenuOpen ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
          transition: "clip-path 0.65s cubic-bezier(0.76, 0, 0.24, 1)",
        }}
      >
        {/* Spacer to account for header height (mt-7 + 70px) */}
        <div className="shrink-0 h-[98px]" />

        {/* Nav items */}
        <nav className="flex-1 flex flex-col justify-center px-6 overflow-hidden">
          {navItems.map((item, i) => (
            <div
              key={item.label}
              className="border-b border-white/10"
              style={{
                transitionProperty: "opacity, transform",
                transitionDuration: "480ms",
                transitionTimingFunction: "cubic-bezier(0.33, 1, 0.68, 1)",
                transitionDelay: isMenuOpen ? `${180 + i * 80}ms` : "0ms",
                opacity: isMenuOpen ? 1 : 0,
                transform: isMenuOpen ? "translateY(0)" : "translateY(24px)",
              }}
            >
              <Link
                href={item.href}
                onClick={closeMenu}
                tabIndex={isMenuOpen ? 0 : -1}
                className="flex items-baseline gap-4 py-[clamp(0.75rem,2.5vw,1.25rem)] group"
              >
                <span className="font-[family-name:var(--font-archivo)] text-[11px] font-medium text-white/30 tabular-nums w-5 shrink-0">
                  0{i + 1}
                </span>
                <span className="font-[family-name:var(--font-archivo)] text-[clamp(2.6rem,11vw,4rem)] font-bold uppercase tracking-tight text-white transition-opacity duration-200 group-hover:opacity-40 leading-none">
                  {item.label}
                </span>
              </Link>
            </div>
          ))}

        </nav>

        {/* Footer — secondary auth items */}
        <div
          className="shrink-0 px-6 py-8 border-t border-white/10"
          style={{
            transitionProperty: "opacity, transform",
            transitionDuration: "480ms",
            transitionTimingFunction: "cubic-bezier(0.33, 1, 0.68, 1)",
            transitionDelay: isMenuOpen ? "440ms" : "0ms",
            opacity: isMenuOpen ? 1 : 0,
            transform: isMenuOpen ? "translateY(0)" : "translateY(20px)",
          }}
        >
          {isAuthenticated ? (
            <div className="flex flex-col gap-5">
              <Link
                href="/profile"
                onClick={closeMenu}
                tabIndex={isMenuOpen ? 0 : -1}
                className="flex items-center gap-3 font-[family-name:var(--font-archivo)] text-xs font-medium uppercase tracking-[0.15em] text-white/50 hover:text-white transition-colors duration-200"
              >
                <User className="h-4 w-4" />
                <span>Mon Profil</span>
              </Link>
              <Link
                href="/my-orders"
                onClick={closeMenu}
                tabIndex={isMenuOpen ? 0 : -1}
                className="flex items-center gap-3 font-[family-name:var(--font-archivo)] text-xs font-medium uppercase tracking-[0.15em] text-white/50 hover:text-white transition-colors duration-200"
              >
                <Package className="h-4 w-4" />
                <span>Mes Commandes</span>
              </Link>
              {hasShopAccess && (
                <Link
                  href={isAdmin ? "/admin" : "/dashboard"}
                  onClick={closeMenu}
                  tabIndex={isMenuOpen ? 0 : -1}
                  className="flex items-center gap-3 font-[family-name:var(--font-archivo)] text-xs font-medium uppercase tracking-[0.15em] text-white/50 hover:text-white transition-colors duration-200"
                >
                  <Store className="h-4 w-4" />
                  <span>{isAdmin ? "Gérer KPSULL" : "Ma Boutique"}</span>
                </Link>
              )}
              <Link
                href="/logout"
                onClick={closeMenu}
                tabIndex={isMenuOpen ? 0 : -1}
                className="flex items-center gap-3 font-[family-name:var(--font-archivo)] text-xs font-bold uppercase tracking-[0.15em] text-white hover:opacity-60 transition-opacity duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span>SE DÉCONNECTER</span>
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={closeMenu}
              tabIndex={isMenuOpen ? 0 : -1}
              className="flex items-center gap-3 font-[family-name:var(--font-archivo)] text-xs font-bold uppercase tracking-[0.15em] text-white hover:opacity-60 transition-opacity duration-200"
            >
              <LogIn className="h-4 w-4" />
              <span>SE CONNECTER</span>
            </Link>
          )}
        </div>
      </div>

      {/* ─── Main header — above overlay ─── */}
      <header className="relative z-[101] mt-7 h-[70px] bg-white">
        {/* Top decorative double lines */}
        <div className="absolute inset-x-0 top-1 h-[2px] bg-black" />
        <div className="absolute inset-x-0 top-2 h-[2px] bg-black" />

        {/* Desktop header */}
        <div className="hidden h-full items-center px-12 md:flex lg:px-[90px]">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Logo size="sm" className="h-[41px] w-[40px]" />
          </Link>

          {/* Spacer pushes nav + account to the right */}
          <div className="flex-1" />

          {/* Navigation */}
          <nav className="flex items-center gap-10">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "font-[family-name:var(--font-archivo)] text-[18px] font-medium uppercase tracking-wide text-black transition-opacity hover:opacity-70"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Account section */}
          {isAuthenticated ? (
            <div className="relative -mr-12 ml-8 flex h-full items-center pr-12 lg:-mr-[90px] lg:pr-[90px]">
              {/* Double vertical separator lines */}
              <div className="flex h-full items-center gap-1 pr-8">
                <div className="h-full w-px bg-black" />
                <div className="h-full w-px bg-black" />
              </div>

              {/* Cart icon + dropdown */}
              <CartDropdown isAuthenticated={isAuthenticated} />

              {/* Profile icon + dropdown */}
              <div className="group/profile ml-6 flex h-full items-center">
                <button
                  className="relative flex items-center gap-2 transition-opacity hover:opacity-70 before:pointer-events-auto before:absolute before:-inset-x-2 before:top-full before:h-10 before:content-['']"
                  aria-label="Mon compte"
                >
                  <AccountIcon className="h-5 w-5" />
                  <span className="font-[family-name:var(--font-archivo)] text-[18px] font-medium uppercase tracking-wide">
                    Compte
                  </span>
                </button>

                {/* Profile dropdown panel */}
                <div className="pointer-events-none absolute -left-[5px] right-0 top-full opacity-0 group-hover/profile:pointer-events-auto group-hover/profile:opacity-100 transition-[opacity] duration-200">
                  <div className="relative -mt-[5px] bg-white pt-[5px] pb-[18px]">
                    {/* Vertical grid lines — left */}
                    <div className="absolute inset-y-0 left-[5px] flex gap-1">
                      <div className="w-px bg-black" />
                      <div className="w-px bg-black" />
                    </div>

                    {/* Vertical grid lines — right */}
                    <div className="absolute inset-y-0 right-[5px] flex gap-1">
                      <div className="w-px bg-black" />
                      <div className="w-px bg-black" />
                    </div>

                    {/* Bottom double lines */}
                    <div className="absolute inset-x-0 bottom-[9px] h-[2px] bg-black" />
                    <div className="absolute inset-x-0 bottom-[5px] h-[2px] bg-black" />

                    <div className="px-4 py-0">
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 font-[family-name:var(--font-archivo)] text-[14px] font-medium uppercase tracking-wide text-black transition-colors hover:bg-black hover:text-white"
                      >
                        <User className="h-4 w-4" />
                        <span>Mon Profil</span>
                      </Link>
                      <Link
                        href="/my-orders"
                        className="flex items-center gap-3 px-4 py-2.5 font-[family-name:var(--font-archivo)] text-[14px] font-medium uppercase tracking-wide text-black transition-colors hover:bg-black hover:text-white"
                      >
                        <Package className="h-4 w-4" />
                        <span>Mes Commandes</span>
                      </Link>
                      {hasShopAccess && (
                        <Link
                          href={isAdmin ? "/admin" : "/dashboard"}
                          className="flex items-center gap-3 px-4 py-2.5 font-[family-name:var(--font-archivo)] text-[14px] font-medium uppercase tracking-wide text-black transition-colors hover:bg-black hover:text-white"
                        >
                          <Store className="h-4 w-4" />
                          <span>
                            {isAdmin ? "Gerer Kpsull" : "Ma Boutique"}
                          </span>
                        </Link>
                      )}

                      {/* Full-width double line separator */}
                      <div className="-mx-4 my-1.5 space-y-[2px]">
                        <div className="h-[1px] bg-black" />
                        <div className="h-[1px] bg-black" />
                      </div>

                      <Link
                        href="/logout"
                        className="flex items-center gap-3 px-4 py-2.5 font-[family-name:var(--font-archivo)] text-[14px] font-medium uppercase tracking-wide text-black transition-colors hover:bg-black hover:text-white"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Deconnexion</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative -mr-12 ml-8 flex h-full items-center pr-12 lg:-mr-[90px] lg:pr-[90px]">
              {/* Double vertical separator lines */}
              <div className="flex h-full items-center gap-1 pr-8">
                <div className="h-full w-px bg-black" />
                <div className="h-full w-px bg-black" />
              </div>

              {/* Cart icon + dropdown (non-authenticated) */}
              <CartDropdown isAuthenticated={false} />

              {/* Login link */}
              <Link
                href="/login"
                className="ml-6 flex items-center gap-2 transition-opacity hover:opacity-70"
              >
                <LogIn className="h-4 w-4" />
                <span className="font-[family-name:var(--font-montserrat)] text-[17px] font-bold uppercase tracking-wide">
                  SE CONNECTER
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile header */}
        <div className="flex h-full items-center justify-between px-4 md:hidden">
          {/* Hamburger → X morphing button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="relative z-10 flex flex-col items-center justify-center gap-[5px] w-6 h-[18px]"
            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isMenuOpen}
          >
            <span
              className={cn(
                "block h-[2px] w-6 bg-black origin-center transition-all duration-300 ease-in-out",
                isMenuOpen && "rotate-45 translate-y-[7px]"
              )}
            />
            <span
              className={cn(
                "block h-[2px] w-6 bg-black transition-all duration-300 ease-in-out",
                isMenuOpen && "opacity-0 scale-x-0"
              )}
            />
            <span
              className={cn(
                "block h-[2px] w-6 bg-black origin-center transition-all duration-300 ease-in-out",
                isMenuOpen && "-rotate-45 -translate-y-[7px]"
              )}
            />
          </button>

          {/* Logo center */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <Logo size="sm" className="h-7 w-7" />
          </Link>

          {/* Cart + User icons right */}
          <div className="flex items-center gap-4">
            <Link
              href="/cart"
              className="relative flex items-center"
              aria-label="Panier"
            >
              <ShoppingCart className="h-5 w-5" />
            </Link>
            <Link href={accountHref} className="flex items-center">
              <AccountIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Bottom decorative double lines */}
        <div className="absolute inset-x-0 bottom-[9px] h-[2px] bg-black" />
        <div className="absolute inset-x-0 bottom-[5px] h-[2px] bg-black" />
      </header>
    </>
  );
}
