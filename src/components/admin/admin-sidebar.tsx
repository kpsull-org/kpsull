'use client';

import {
  LayoutDashboard,
  Package,
  Store,
  Users,
  Shield,
  DollarSign,
} from 'lucide-react';
import { AppSidebar, type SidebarItem } from '@/components/shared/app-sidebar';

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Commandes', href: '/admin/orders', icon: Package },
  { label: 'Createurs', href: '/admin/creators', icon: Store },
  { label: 'Clients', href: '/admin/clients', icon: Users },
  { label: 'Moderation', href: '/admin/moderation', icon: Shield },
  { label: 'Revenus', href: '/admin/revenue', icon: DollarSign },
];

export interface AdminSidebarProps {
  badges?: Record<string, number>;
}

export function AdminSidebar({ badges }: AdminSidebarProps) {
  return (
    <AppSidebar
      items={sidebarItems}
      sectionLabel="Administration"
      badges={badges}
    />
  );
}
