export interface Breadcrumb {
  labelKey: string;
  defaultLabel: string;
  to?: string;
}

interface StaticRoute {
  path: string;
  labelKey: string;
  defaultLabel: string;
}

interface DynamicRoute {
  pattern: RegExp;
  resolve: (match: RegExpMatchArray) => {
    labelKey: string;
    defaultLabel: string;
  };
}

// NOTE: Static routes are matched by exact prefix during the walk, so adding a
// new page here makes it appear automatically in the trail.
// t('nav.admin', 'Admin')
// t('admin.users', 'Users')
// t('settings.title', 'Settings')
// t('settings.profile', 'Profile')
// t('settings.appearance', 'Appearance')
// t('settings.about', 'About')
const STATIC_ROUTES: StaticRoute[] = [
  { path: "/admin", labelKey: "nav.admin", defaultLabel: "Admin" },
  { path: "/admin/users", labelKey: "admin.users", defaultLabel: "Users" },
  { path: "/settings", labelKey: "settings.title", defaultLabel: "Settings" },
  {
    path: "/settings/profile",
    labelKey: "settings.profile",
    defaultLabel: "Profile",
  },
  {
    path: "/settings/appearance",
    labelKey: "settings.appearance",
    defaultLabel: "Appearance",
  },
  {
    path: "/settings/about",
    labelKey: "settings.about",
    defaultLabel: "About",
  },
];

// NOTE: Dynamic routes are matched when a prefix has no static entry. The
// resolver receives the RegExp match so it can surface the captured segment
// (e.g. a user email) as the default label.
const DYNAMIC_ROUTES: DynamicRoute[] = [
  {
    pattern: /^\/admin\/users\/([^/]+)$/,
    resolve: (match) => ({
      labelKey: "admin.user",
      defaultLabel: decodeURIComponent(match[1] ?? ""),
    }),
  },
];

function resolvePath(
  path: string,
): { labelKey: string; defaultLabel: string } | null {
  const staticMatch = STATIC_ROUTES.find((r) => r.path === path);
  if (staticMatch) {
    return {
      labelKey: staticMatch.labelKey,
      defaultLabel: staticMatch.defaultLabel,
    };
  }
  for (const route of DYNAMIC_ROUTES) {
    const match = path.match(route.pattern);
    if (match) return route.resolve(match);
  }
  return null;
}

export function buildBreadcrumbs(pathname: string): Breadcrumb[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [];

  const crumbs: Breadcrumb[] = [];
  for (let i = 0; i < segments.length; i++) {
    const path = `/${segments.slice(0, i + 1).join("/")}`;
    const label = resolvePath(path);
    if (!label) continue;
    const isLast = i === segments.length - 1;
    crumbs.push({
      labelKey: label.labelKey,
      defaultLabel: label.defaultLabel,
      to: isLast ? undefined : path,
    });
  }
  return crumbs;
}
