"use client";

import Link from "next/link";
import { Menu, User, LogIn, Package, Store, LogOut, ShoppingCart } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { CartDropdown } from "@/components/layout/cart-dropdown";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { label: "CREATEURS", href: "/createurs" },
  { label: "A PROPOS", href: "/a-propos" },
  { label: "CATALOGUE", href: "/catalogue" },
];

interface HeaderProps {
  user?: {
    name?: string | null;
    image?: string | null;
    role?: string;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const isAuthenticated = !!user;
  const accountHref = isAuthenticated ? "/mon-compte" : "/login";
  const AccountIcon = isAuthenticated ? User : LogIn;
  const isAdmin = user?.role === "ADMIN";
  const hasShopAccess = user?.role === "CREATOR" || isAdmin;

  return (
    <header className="relative z-50 mt-7 h-[70px] bg-white">
      {/* Top decorative double lines (Figma: y:4 and y:8, h:2) */}
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

        {/* Navigation (Figma: Archivo 500, 18px, uppercase, right-aligned) */}
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

        {/* Account section: separator + icons + dropdowns (spans to page edge) */}
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
              <button className="relative flex items-center gap-2 transition-opacity hover:opacity-70 before:pointer-events-auto before:absolute before:-inset-x-2 before:top-full before:h-10 before:content-['']" aria-label="Mon compte">
                <AccountIcon className="h-5 w-5" />
                <span className="font-[family-name:var(--font-archivo)] text-[18px] font-medium uppercase tracking-wide">Compte</span>
              </button>

              {/* Profile dropdown panel - flush with header bottom, hover bridge via ::before on button */}
              <div className="pointer-events-none absolute -left-[5px] right-0 top-full opacity-0 group-hover/profile:pointer-events-auto group-hover/profile:opacity-100 transition-[opacity] duration-200">
                <div className="relative -mt-[5px] bg-white pt-[5px] pb-[18px]">
                  {/* Vertical grid lines — left */}
                  <div className="absolute inset-y-0 left-[5px] flex gap-1">
                    <div className="w-px bg-black" />
                    <div className="w-px bg-black" />
                  </div>

                  {/* Vertical grid lines — right (symétrique) */}
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
                        <span>{isAdmin ? "Gerer Kpsull" : "Ma Boutique"}</span>
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

            {/* Login link - to the right of cart */}
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
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger className="flex items-center">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle className="font-[family-name:var(--font-archivo)] text-xl font-semibold">
                MENU
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-8 flex flex-col gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "font-[family-name:var(--font-archivo)] font-medium text-lg text-black uppercase hover:opacity-70 transition-opacity"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              {hasShopAccess && (
                <Link
                  href={isAdmin ? "/admin" : "/dashboard"}
                  className={cn(
                    "font-[family-name:var(--font-archivo)] font-medium text-lg text-black uppercase hover:opacity-70 transition-opacity flex items-center gap-2"
                  )}
                >
                  <Store className="h-5 w-5" />
                  <span>{isAdmin ? "GERER KPSULL" : "MA BOUTIQUE"}</span>
                </Link>
              )}
              <div className="my-4 h-px bg-gray-200" />
              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 font-[family-name:var(--font-archivo)] font-medium text-lg text-black hover:opacity-70 transition-opacity"
                  >
                    <User className="h-5 w-5" />
                    <span>Mon Profil</span>
                  </Link>
                  <Link
                    href="/my-orders"
                    className="flex items-center gap-2 font-[family-name:var(--font-archivo)] font-medium text-lg text-black hover:opacity-70 transition-opacity"
                  >
                    <Package className="h-5 w-5" />
                    <span>Mes Commandes</span>
                  </Link>
                  <Link
                    href="/logout"
                    className="flex items-center gap-2 font-[family-name:var(--font-montserrat)] font-bold text-lg hover:opacity-70 transition-opacity"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>SE DECONNECTER</span>
                  </Link>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 font-[family-name:var(--font-montserrat)] font-bold text-lg hover:opacity-70 transition-opacity"
                >
                  <LogIn className="h-5 w-5" />
                  <span>SE CONNECTER</span>
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo center */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          <Logo size="sm" className="h-7 w-7" />
        </Link>

        {/* Cart + User icons right */}
        <div className="flex items-center gap-4">
          <Link href="/cart" className="relative flex items-center" aria-label="Panier">
            <ShoppingCart className="h-5 w-5" />
          </Link>
          <Link href={accountHref} className="flex items-center">
            <AccountIcon className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Bottom decorative double lines (Figma: y:59 and y:63, h:2) */}
      <div className="absolute inset-x-0 bottom-[9px] h-[2px] bg-black" />
      <div className="absolute inset-x-0 bottom-[5px] h-[2px] bg-black" />
    </header>
  );
}
