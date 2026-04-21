import {
  Globe,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Shield,
} from "lucide-react";
import type { ElementType, SVGProps } from "react";
import { GithubIcon } from "@/client/components/icons/GithubIcon";

// NOTE: ElementType (not ComponentType) so it fits lucide's ForwardRefExotic
// components, inline React icons, and `<img>`-based brand marks without
// per-item casts.
export type NavItemIcon = ElementType<{
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

export interface NavItem {
  to: string;
  labelKey: string;
  defaultLabel: string;
  icon: NavItemIcon;
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

export interface FooterLink {
  href: string;
  labelKey: string;
  defaultLabel: string;
  icon: ElementType<SVGProps<SVGSVGElement>>;
}

export interface SupportContact {
  emailKey: string;
  defaultEmail: string;
  labelKey: string;
  defaultLabel: string;
  icon: ElementType<SVGProps<SVGSVGElement>>;
}

// NOTE: SUPPORT_LINK renders above SECONDARY_LINKS with a "Need help?" label
// and opens a modal with the email + copy-to-clipboard action (instead of
// a raw mailto: link, which is unreliable when the user has no mail client).
// The email itself is i18n-driven so projects can route support to a
// locale-specific inbox. Set to null to hide the support block entirely.
// t('nav.support', 'Support')
// t('support.email', 'support@fazer.ai')
export const SUPPORT_LINK: SupportContact | null = {
  emailKey: "support.email",
  defaultEmail: "support@fazer.ai",
  labelKey: "nav.support",
  defaultLabel: "Support",
  icon: LifeBuoy,
};

// t('nav.website', 'fazer.ai')
// t('nav.github', 'GitHub')
export const SECONDARY_LINKS: FooterLink[] = [
  {
    href: "https://fazer.ai",
    labelKey: "nav.website",
    defaultLabel: "fazer.ai",
    icon: Globe,
  },
  {
    href: "https://github.com/fazer-ai/bunfire",
    labelKey: "nav.github",
    defaultLabel: "GitHub",
    icon: GithubIcon,
  },
];
