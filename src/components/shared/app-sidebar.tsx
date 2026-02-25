'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, LogOut, ChevronLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/logo';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname.startsWith(href);
}

interface SidebarNavProps {
  items: SidebarItem[];
  badges?: Record<string, number>;
  onNavigate?: () => void;
}

function SidebarNav({ items, badges, onNavigate }: Readonly<SidebarNavProps>) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        const badgeCount = badges?.[item.href];
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {badgeCount !== undefined && badgeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export interface AppSidebarProps {
  items: SidebarItem[];
  sectionLabel: string;
  badges?: Record<string, number>;
}

export function AppSidebar({ items, sectionLabel, badges }: Readonly<AppSidebarProps>) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden fixed left-0 top-0 h-screen w-[260px] border-r bg-white z-40 md:flex md:flex-col">
        {/* Logo + Back to site */}
        <div className="flex h-16 items-center justify-between border-b px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size="sm" className="h-7 w-7" />
            <span className="font-[family-name:var(--font-archivo)] text-sm font-bold uppercase tracking-wider">
              KPSULL
            </span>
          </Link>
          <Link
            href="/"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Retour au site"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            {sectionLabel}
          </p>
          <SidebarNav items={items} badges={badges} />
        </div>

        {/* Footer */}
        <div className="border-t px-3 py-3">
          <Link
            href="/logout"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span>Se deconnecter</span>
          </Link>
        </div>
      </aside>

      {/* Mobile header with hamburger */}
      <div className="flex h-14 items-center gap-3 border-b bg-white px-4 md:hidden">
        <Sheet>
          <SheetTrigger className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetHeader className="border-b px-5 py-4">
              <SheetTitle className="flex items-center gap-2.5">
                <Logo size="sm" className="h-6 w-6" />
                <span className="font-[family-name:var(--font-archivo)] text-sm font-bold uppercase tracking-wider">
                  KPSULL
                </span>
              </SheetTitle>
            </SheetHeader>
            <div className="px-3 py-4">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {sectionLabel}
              </p>
              <SidebarNav items={items} badges={badges} />
            </div>
            <div className="border-t px-3 py-3">
              <Link
                href="/logout"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span>Se deconnecter</span>
              </Link>
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/" className="flex items-center gap-2">
          <Logo size="sm" className="h-6 w-6" />
          <span className="font-[family-name:var(--font-archivo)] text-xs font-bold uppercase tracking-wider">
            KPSULL
          </span>
        </Link>

        <div className="ml-auto text-xs text-muted-foreground">
          {items.find((item) => isActive(pathname, item.href, item.exact))?.label ?? ''}
        </div>
      </div>
    </>
  );
}
