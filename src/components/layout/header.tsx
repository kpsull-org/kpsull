"use client";

import Link from "next/link";
import { Menu, User } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { label: "CREATEURS", href: "/catalogue" },
  { label: "A PROPOS", href: "/a-propos" },
  { label: "SELECTION DU MOMENT", href: "/catalogue?promo=true" },
];

export function Header() {
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
              key={item.href}
              href={item.href}
              className={cn(
                "font-[family-name:var(--font-archivo)] text-[18px] font-medium uppercase tracking-wide text-black transition-opacity hover:opacity-70"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Double vertical separator lines (Figma: x:1663/1667, full height) */}
        <div className="mx-8 flex h-full items-center gap-1">
          <div className="h-full w-px bg-black" />
          <div className="h-full w-px bg-black" />
        </div>

        {/* Account section (Figma: Montserrat 700, 17px) */}
        <Link
          href="/login"
          className="flex items-center gap-2 transition-opacity hover:opacity-70"
        >
          <User className="h-4 w-4" />
          <span className="font-[family-name:var(--font-montserrat)] text-[17px] font-bold uppercase tracking-wide">
            ACCOUNT
          </span>
        </Link>
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
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "font-[family-name:var(--font-archivo)] font-medium text-lg text-black uppercase hover:opacity-70 transition-opacity"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-4 h-px bg-gray-200" />
              <Link
                href="/login"
                className="flex items-center gap-2 font-[family-name:var(--font-montserrat)] font-bold text-lg hover:opacity-70 transition-opacity"
              >
                <User className="h-5 w-5" />
                <span>ACCOUNT</span>
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo center */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          <Logo size="sm" className="h-7 w-7" />
        </Link>

        {/* User icon right */}
        <Link href="/login" className="flex items-center">
          <User className="h-5 w-5" />
        </Link>
      </div>

      {/* Bottom decorative double lines (Figma: y:59 and y:63, h:2) */}
      <div className="absolute inset-x-0 bottom-[9px] h-[2px] bg-black" />
      <div className="absolute inset-x-0 bottom-[5px] h-[2px] bg-black" />
    </header>
  );
}
