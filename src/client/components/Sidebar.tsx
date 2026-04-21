import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, NavLink } from "react-router";

import { Tooltip } from "@/client/components/Tooltip";
import { useAuth } from "@/client/contexts/AuthContext";
import {
  SIDEBAR_COLLAPSED_WIDTH,
  useSidebar,
} from "@/client/contexts/SidebarContext";
import { useThemedAsset } from "@/client/contexts/ThemeContext";
import {
  filterNavItems,
  NAV_ITEMS,
  type NavItem,
} from "@/client/lib/navigation";
import { cn, getAssetUrl } from "@/client/lib/utils";
import { SidebarResizer } from "./SidebarResizer";

type SidebarVariant = "desktop" | "mobile";

interface SidebarNavProps {
  items: NavItem[];
  variant: SidebarVariant;
  collapsed?: boolean;
  onNavigate?: () => void;
}

function SidebarNav({
  items,
  variant,
  collapsed = false,
  onNavigate,
}: SidebarNavProps) {
  const { t } = useTranslation();
  const isCollapsed = variant === "desktop" && collapsed;

  return (
    <nav
      aria-label={t("nav.mainNavigation", "Main navigation")}
      className="sidebar-nav flex-1 overflow-y-auto p-2"
    >
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          // biome-ignore lint/plugin: extracted via magic comments in src/client/lib/navigation.tsx
          const label = t(item.labelKey, item.defaultLabel);
          const link = (
            <NavLink
              to={item.to}
              end={item.to === "/"}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  {
                    "justify-center": isCollapsed,
                    "bg-bg-hover text-text-primary": isActive,
                    "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary":
                      !isActive,
                  },
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {isCollapsed ? (
                // NOTE: accessible name for the icon-only collapsed link; the
                // Tooltip wrapping this link contributes aria-describedby, not
                // a name, so the link still needs its own label.
                <span className="sr-only">{label}</span>
              ) : (
                <span className="truncate">{label}</span>
              )}
            </NavLink>
          );

          return (
            <li key={item.to}>
              {isCollapsed ? (
                // NOTE: wrap in <span> so Radix Tooltip's Slot does not clone
                // the NavLink directly; cloning breaks NavLink's function
                // className (isActive) by stringifying it during prop merge.
                <Tooltip content={label} side="right" sideOffset={10}>
                  <span className="block">{link}</span>
                </Tooltip>
              ) : (
                link
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SidebarCollapseToggle({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation();
  const { toggleCollapsed } = useSidebar();
  const label = collapsed
    ? t("nav.expand", "Expand")
    : t("nav.collapse", "Collapse");
  const Icon = collapsed ? ChevronRight : ChevronLeft;

  return (
    <Tooltip content={label} side="right" sideOffset={10}>
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-pressed={!collapsed}
        aria-controls="app-sidebar"
        aria-label={label}
        className="absolute top-[20%] right-0 z-(--z-sidebar-toggle) flex h-6 w-6 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg-secondary text-text-secondary shadow-sm transition-[background-color,color] hover:bg-bg-hover hover:text-text-primary"
      >
        <Icon className="h-3 w-3" />
      </button>
    </Tooltip>
  );
}

interface MobileSidebarProps {
  items: NavItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function MobileSidebar({ items, open, onOpenChange }: MobileSidebarProps) {
  const { t } = useTranslation();
  const logoPath = useThemedAsset("/assets/logo.png");

  // NOTE: avoid mounting a Radix Portal on desktop viewports; only attach the
  // dialog tree while the drawer is actually open.
  if (!open) return null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-(--z-drawer-overlay) bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in md:hidden" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left fixed inset-y-0 left-0 z-(--z-drawer) flex w-72 max-w-[85vw] flex-col border-border border-r bg-bg-secondary shadow-lg data-[state=closed]:animate-out data-[state=open]:animate-in md:hidden"
        >
          <div className="flex shrink-0 items-center justify-between border-border border-b px-4 py-3">
            <DialogPrimitive.Title className="sr-only">
              {t("nav.mainNavigation", "Main navigation")}
            </DialogPrimitive.Title>
            <Link
              to="/"
              onClick={() => onOpenChange(false)}
              className="flex items-center"
            >
              <img
                src={getAssetUrl(logoPath)}
                // t('common.logoAlt', 'Logo')
                alt={t("common.logoAlt", "Logo")}
                className="h-7 w-auto"
              />
            </Link>
            <DialogPrimitive.Close
              aria-label={t("nav.closeMenu", "Close menu")}
              className="rounded-lg p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
          <SidebarNav
            items={items}
            variant="mobile"
            onNavigate={() => onOpenChange(false)}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function Sidebar() {
  const { user } = useAuth();
  const { collapsed, width, mobileOpen, setMobileOpen } = useSidebar();
  const items = filterNavItems(NAV_ITEMS, user?.role);
  const effectiveWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : width;

  return (
    <>
      <aside
        id="app-sidebar"
        style={{ width: effectiveWidth }}
        className="group/sidebar relative hidden shrink-0 flex-col border-border border-r bg-bg-secondary transition-[width] duration-150 md:flex"
      >
        <SidebarNav items={items} variant="desktop" collapsed={collapsed} />
        <SidebarResizer />
        <SidebarCollapseToggle collapsed={collapsed} />
      </aside>

      <MobileSidebar
        items={items}
        open={mobileOpen}
        onOpenChange={setMobileOpen}
      />
    </>
  );
}
