import {
  LayoutDashboard,
  type LucideIcon,
  Settings,
  Shield,
} from "lucide-react";

export interface NavItem {
  to: string;
  labelKey: string;
  defaultLabel: string;
  icon: LucideIcon;
  // NOTE: bump to requiredRole if more roles are added
  requireAdmin?: boolean;
}

// t('nav.home', 'Home')
// t('nav.admin', 'Admin')
// t('nav.settings', 'Settings')
export const NAV_ITEMS: NavItem[] = [
  {
    to: "/",
    labelKey: "nav.home",
    defaultLabel: "Home",
    icon: LayoutDashboard,
  },
  {
    to: "/admin",
    labelKey: "nav.admin",
    defaultLabel: "Admin",
    icon: Shield,
    requireAdmin: true,
  },
  {
    to: "/settings",
    labelKey: "nav.settings",
    defaultLabel: "Settings",
    icon: Settings,
  },
];

export function filterNavItems(
  items: NavItem[],
  role: string | undefined,
): NavItem[] {
  return items.filter((item) => !item.requireAdmin || role === "ADMIN");
}
