'use client';

import {
  LayoutDashboard,
  ShoppingBag,
  FolderOpen,
  Package,
  Users,
  RotateCcw,
  CreditCard,
  Globe,
} from 'lucide-react';
import { AppSidebar, type SidebarItem } from '@/components/shared/app-sidebar';

const sidebarItems: SidebarItem[] = [
  { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Produits', href: '/dashboard/products', icon: ShoppingBag },
  { label: 'Collections', href: '/dashboard/collections', icon: FolderOpen },
  { label: 'Ma page', href: '/dashboard/ma-page', icon: Globe },
  { label: 'Commandes', href: '/dashboard/orders', icon: Package },
  { label: 'Clients', href: '/dashboard/customers', icon: Users },
  { label: 'Retours', href: '/dashboard/returns', icon: RotateCcw },
  { label: 'Abonnement', href: '/subscription', icon: CreditCard },
];

export interface DashboardSidebarProps {
  badges?: Record<string, number>;
}

export function DashboardSidebar({ badges }: DashboardSidebarProps) {
  return (
    <AppSidebar
      items={sidebarItems}
      sectionLabel="Gestion"
      badges={badges}
    />
  );
}
